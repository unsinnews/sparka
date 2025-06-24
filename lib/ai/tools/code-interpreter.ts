import z from 'zod';
import { tool } from 'ai';
import CodeInterpreter from '@e2b/code-interpreter';

export const codeInterpreter = tool({
  description: `Write and execute Python code.

**When to use \`codeInterpreter\`:**
- Use this Python-only sandbox for calculations, data analysis, or gevisualizations
- matplotlib, pandas, numpy, sympy, and yfinance are available
- Remember to add the necessary imports for the libraries you use as they are not pre-imported
- Include library installations (!pip install <library_name>) in the code where required
- You can generate line, scatter or bar charts for data analysis.
  - If you generate a line chart, you must use the 'plt.show()' function to display the chart.
  - Be sure to select adequate 
- Images are not allowed in the response! Do not create images.

**When NOT to use \`codeInterpreter\`:**
- Do not use this tool for other languages.
- Do not use this tool for other chart types.`,
  parameters: z.object({
    title: z.string().describe('The title of the code snippet.'),
    code: z
      .string()
      .describe(
        'The Python code to execute. put the variables in the end of the code to print them. do not use the print function.',
      ),
    icon: z
      .enum(['stock', 'date', 'calculation', 'default'])
      .describe('The icon to display for the code snippet.'),
  }),
  execute: async ({
    code,
    title,
    icon,
  }: { code: string; title: string; icon: string }) => {
    console.log('Code:', code);
    console.log('Title:', title);
    console.log('Icon:', icon);

    const sandbox = await CodeInterpreter.create(
      process.env.SANDBOX_TEMPLATE_ID as string,
    );
    const execution = await sandbox.runCode(code);
    let message = '';

    if (execution.results.length > 0) {
      for (const result of execution.results) {
        if (result.isMainResult) {
          message += `${result.text}\n`;
        } else {
          message += `${result.text}\n`;
        }
      }
    }

    if (execution.logs.stdout.length > 0 || execution.logs.stderr.length > 0) {
      if (execution.logs.stdout.length > 0) {
        message += `${execution.logs.stdout.join('\n')}\n`;
      }
      if (execution.logs.stderr.length > 0) {
        message += `${execution.logs.stderr.join('\n')}\n`;
      }
    }

    if (execution.error) {
      message += `Error: ${execution.error}\n`;
      console.log('Error: ', execution.error);
    }

    console.log(execution.results);
    if (execution.results[0].chart) {
      execution.results[0].chart.elements.map((element: any) => {
        console.log(element.points);
      });
    }

    return {
      message: message.trim(),
      chart: execution.results[0].chart ?? '',
    };
  },
});
