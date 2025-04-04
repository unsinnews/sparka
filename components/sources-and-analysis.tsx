import { motion } from 'framer-motion';
import {
  Search,
  FileText,
  BookA,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Tweet } from 'react-tweet';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { XLogo } from '@phosphor-icons/react';

// Runtime imports (used with z.infer)
import type {
  AnalysisUpdate,
  WebSearchUpdate,
} from '@/lib/ai/tools/research-updates-schema';

// Define non-nullable item types for clarity in map callbacks
type SearchResultItem = NonNullable<WebSearchUpdate['results']>[number];
type AnalysisFindingItem = NonNullable<AnalysisUpdate['findings']>[number];
type AnalysisGapItem = NonNullable<AnalysisUpdate['gaps']>[number];
type AnalysisRecommendationItem = NonNullable<
  AnalysisUpdate['recommendations']
>[number];

// Define the type for the analysis results structure used in sourceGroups
// Arrays here match the optional arrays in AnalysisSchema
type MappedAnalysisResult = {
  type: string;
  findings: AnalysisFindingItem[] | undefined;
  gaps: AnalysisGapItem[] | undefined;
  recommendations: AnalysisRecommendationItem[] | undefined;
  uncertainties: string[] | undefined;
};

const SourcesList = ({
  sources,
  type,
}: {
  sources: SearchResultItem[] | undefined;
  type: 'web' | 'academic' | 'x';
}) => {
  if (type === 'x') {
    return (
      <div className="space-y-4 max-w-xl mx-auto">
        {sources?.map((source: SearchResultItem, i: number) =>
          source.tweetId ? (
            <div key={i} className="tweet-container">
              <Tweet id={source.tweetId} />
            </div>
          ) : (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <XLogo className="h-4 w-4 text-neutral-500" />
                </div>
                <div>
                  <h4 className="text-sm font-medium leading-tight">
                    {source.title}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                    {source.content}
                  </p>
                </div>
              </div>
            </a>
          ),
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sources?.map((source: SearchResultItem, i: number) => (
        <a
          key={i}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <img
                src={`https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}&sz=128`}
                alt=""
                className="w-4 h-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden">
                {type === 'web' ? (
                  <FileText className="h-4 w-4 text-neutral-500" />
                ) : type === 'academic' ? (
                  <BookA className="h-4 w-4 text-neutral-500" />
                ) : (
                  <XLogo className="h-4 w-4 text-neutral-500" />
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium leading-tight">
                {source.title}
              </h4>
              <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                {source.content}
              </p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
};

const AllSourcesView = ({
  sources,
  type,
  id,
}: {
  sources: SearchResultItem[] | undefined;
  type: 'web' | 'academic' | 'x';
  id?: string;
}) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const title =
    type === 'web'
      ? 'Web Sources'
      : type === 'academic'
        ? 'Academic Sources'
        : 'X Posts';

  if (isDesktop) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button id={id} className="hidden" type="button">
            Show All
          </button>
        </DialogTrigger>
        <DialogContent
          className={cn(
            'max-h-[80vh] overflow-y-auto',
            type === 'x' ? 'max-w-2xl' : 'max-w-4xl',
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {type === 'web' && <FileText className="h-4 w-4" />}
              {type === 'academic' && <BookA className="h-4 w-4" />}
              {type === 'x' && <XLogo className="h-4 w-4" />}
              {title}
            </DialogTitle>
          </DialogHeader>
          <SourcesList sources={sources} type={type} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button id={id} className="hidden" type="button">
          Show All
        </button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            {type === 'web' && <FileText className="h-4 w-4" />}
            {type === 'academic' && <BookA className="h-4 w-4" />}
            {type === 'x' && <XLogo className="h-4 w-4" />}
            {title}
          </DrawerTitle>
        </DrawerHeader>
        <div className="p-4 overflow-y-auto">
          <SourcesList sources={sources} type={type} />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const AnimatedTabContent = ({
  children,
  value,
  selected,
}: {
  children: React.ReactNode;
  value: string;
  selected: string;
}) => (
  <motion.div
    role="tabpanel"
    initial={{ opacity: 0, x: 10 }}
    animate={{
      opacity: value === selected ? 1 : 0,
      x: value === selected ? 0 : 10,
      pointerEvents: value === selected ? 'auto' : 'none',
    }}
    transition={{
      duration: 0.2,
      ease: 'easeOut',
    }}
    className={cn(
      'absolute top-0 left-0 right-0',
      value === selected ? 'relative' : 'hidden',
    )}
  >
    {children}
  </motion.div>
);

const EmptyState = ({
  type,
  isLoading = false,
}: { type: 'web' | 'academic' | 'analysis' | 'x'; isLoading?: boolean }) => {
  const icons = {
    web: FileText,
    academic: BookA,
    analysis: Sparkles,
    x: XLogo,
  } as const;
  const Icon = icons[type];

  const messages = {
    web: 'Web sources will appear here once found',
    academic: 'Academic sources will appear here once found',
    analysis: 'Analysis results will appear here once complete',
    x: isLoading ? 'Searching X...' : 'X posts will appear here once found',
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-800">
      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
        ) : type === 'x' ? (
          <XLogo className="w-5 h-5 text-neutral-400" />
        ) : (
          <Icon className="w-5 h-5 text-neutral-400" />
        )}
      </div>
      <p className="text-sm text-neutral-500 text-center">{messages[type]}</p>
    </div>
  );
};

export const SourcesAndAnalysis = ({
  sourceGroups,
  selectedTab,
  setSelectedTab,
  xSearchesRunning,
}: {
  sourceGroups: {
    web: SearchResultItem[];
    academic: SearchResultItem[];
    x: SearchResultItem[];
    analysis: MappedAnalysisResult[];
  };
  selectedTab: string;
  setSelectedTab: (value: string) => void;
  xSearchesRunning: boolean;
}) => {
  if (
    sourceGroups.web.length === 0 &&
    sourceGroups.academic.length === 0 &&
    sourceGroups.x.length === 0 &&
    sourceGroups.analysis.length === 0
  ) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-3.5 w-3.5" />
        <h3 className="text-sm font-medium">Sources & Analysis</h3>
      </div>
      <Tabs
        defaultValue="web"
        className="w-full"
        onValueChange={setSelectedTab}
        value={selectedTab}
      >
        <TabsList className="w-full h-10 grid grid-cols-4 bg-neutral-100/50 dark:bg-neutral-800/50 p-1 rounded-lg">
          <TabsTrigger
            value="web"
            className="h-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 rounded-md"
            disabled={sourceGroups.web.length === 0}
          >
            <div className="flex items-center gap-1.5">
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">Web</span>
              {sourceGroups.web.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1">
                  {sourceGroups.web.length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="academic"
            className="h-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 rounded-md"
            disabled={sourceGroups.academic.length === 0}
          >
            <div className="flex items-center gap-1.5">
              <BookA className="h-3 w-3" />
              <span className="hidden sm:inline">Academic</span>
              {sourceGroups.academic.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1">
                  {sourceGroups.academic.length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="x"
            className="h-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 rounded-md"
            disabled={sourceGroups.x.length === 0}
          >
            <div className="flex items-center gap-1.5">
              <XLogo className="h-3 w-3" />
              <span className="hidden sm:inline">X</span>
              {sourceGroups.x.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1">
                  {sourceGroups.x.length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="h-full data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-800 rounded-md"
            disabled={sourceGroups.analysis.length === 0}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              <span className="hidden sm:inline">Analysis</span>
              {sourceGroups.analysis.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1">
                  {sourceGroups.analysis.length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
        </TabsList>

        <div className="relative mt-4">
          <AnimatedTabContent value="web" selected={selectedTab}>
            {sourceGroups.web.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {sourceGroups.web
                    .slice(0, 3)
                    .map((source: SearchResultItem, i: number) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}&sz=128`}
                              alt=""
                              className="w-3.5 h-3.5"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove(
                                  'hidden',
                                );
                              }}
                            />
                            <div className="hidden">
                              <FileText className="h-3.5 w-3.5 text-neutral-500" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-medium leading-snug truncate">
                              {source.title}
                            </h4>
                            <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                              {source.content}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  {sourceGroups.web.length > 3 && (
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById('show-all-web-sources')?.click()
                      }
                      className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-500 transition-colors" />
                      <span className="text-xs text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
                        Show {sourceGroups.web.length - 3} More Sources
                      </span>
                    </button>
                  )}
                </div>
                {sourceGroups.web.length > 3 && (
                  <div className="hidden">
                    <AllSourcesView
                      sources={sourceGroups.web}
                      type="web"
                      id="show-all-web-sources"
                    />
                  </div>
                )}
              </div>
            ) : (
              <EmptyState type="web" />
            )}
          </AnimatedTabContent>
          <AnimatedTabContent value="academic" selected={selectedTab}>
            {sourceGroups.academic.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {sourceGroups.academic
                    .slice(0, 3)
                    .map((source: SearchResultItem, i: number) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${new URL(source.url).hostname}&sz=128`}
                              alt=""
                              className="w-3.5 h-3.5"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove(
                                  'hidden',
                                );
                              }}
                            />
                            <div className="hidden">
                              <BookA className="h-3.5 w-3.5 text-neutral-500" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-medium leading-snug truncate">
                              {source.title}
                            </h4>
                            <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                              {source.content}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  {sourceGroups.academic.length > 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        document
                          .getElementById('show-all-academic-sources')
                          ?.click();
                      }}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-500 transition-colors" />
                      <span className="text-xs text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
                        Show {sourceGroups.academic.length - 3} More Sources
                      </span>
                    </button>
                  )}
                </div>
                {sourceGroups.academic.length > 3 && (
                  <div className="hidden">
                    <AllSourcesView
                      sources={sourceGroups.academic}
                      type="academic"
                      id="show-all-academic-sources"
                    />
                  </div>
                )}
              </div>
            ) : (
              <EmptyState type="academic" />
            )}
          </AnimatedTabContent>
          <AnimatedTabContent value="x" selected={selectedTab}>
            {sourceGroups.x.length > 0 ? (
              <div className="space-y-3">
                <div className="relative rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
                  <div className="p-4">
                    <div className="flex flex-nowrap overflow-x-auto gap-4 no-scrollbar max-h-[250px]">
                      {sourceGroups.x
                        .slice(0, 2)
                        .map((source: SearchResultItem, i: number) =>
                          source.tweetId ? (
                            <motion.div
                              key={i}
                              className="w-[min(100vw-4rem,320px)] flex-none"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                            >
                              <div className="tweet-container">
                                <Tweet id={source.tweetId} />
                              </div>
                            </motion.div>
                          ) : (
                            <motion.a
                              key={i}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-[min(100vw-4rem,320px)] flex-none block p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 mt-0.5">
                                  <XLogo className="h-3.5 w-3.5 text-neutral-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xs font-medium leading-snug truncate">
                                    {source.title}
                                  </h4>
                                  <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                                    {source.content}
                                  </p>
                                </div>
                              </div>
                            </motion.a>
                          ),
                        )}
                    </div>
                  </div>

                  {sourceGroups.x.length > 2 && (
                    <div className="absolute bottom-0 inset-x-0 flex items-center justify-center pb-4 pt-12 bg-gradient-to-t from-white via-white to-transparent dark:from-black dark:via-black rounded-b-lg">
                      <button
                        type="button"
                        onClick={() =>
                          document.getElementById('show-all-x-sources')?.click()
                        }
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group shadow-sm"
                      >
                        <XLogo className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-500" />
                        <span className="text-xs text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
                          Show all {sourceGroups.x.length} X posts
                        </span>
                      </button>
                    </div>
                  )}
                </div>
                {sourceGroups.x.length > 2 && (
                  <div className="hidden">
                    <AllSourcesView
                      sources={sourceGroups.x}
                      type="x"
                      id="show-all-x-sources"
                    />
                  </div>
                )}
              </div>
            ) : (
              <EmptyState type="x" isLoading={xSearchesRunning} />
            )}
          </AnimatedTabContent>
          <AnimatedTabContent value="analysis" selected={selectedTab}>
            {sourceGroups.analysis.length > 0 ? (
              <div className="space-y-2">
                <Accordion type="multiple" className="w-full space-y-2">
                  {sourceGroups.analysis.map((analysis, i) => (
                    <AccordionItem
                      key={i}
                      value={`analysis-${i}`}
                      className="bg-white dark:bg-black rounded-lg border border-border"
                    >
                      <AccordionTrigger className="px-2 py-1 hover:no-underline text-xs">
                        <div className="flex items-center gap-1.5 text-neutral-600">
                          {analysis.type === 'gaps' ? (
                            <Search className="h-3 w-3" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          <span>
                            {analysis.type.charAt(0).toUpperCase() +
                              analysis.type.slice(1)}
                            {analysis.type === 'gaps' && ' & Limitations'}
                            {analysis.type === 'synthesis' && ' Synthesis'}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                        {analysis.type === 'gaps' && (
                          <div className="grid gap-1.5">
                            {analysis.findings?.map(
                              (finding: AnalysisFindingItem, j: number) => (
                                <div
                                  key={`gap-finding-${j}`}
                                  className="p-2.5 rounded-lg bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700"
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="flex-shrink-0 mt-1">
                                      <div className="w-1 h-1 rounded-full bg-neutral-400" />
                                    </div>
                                    <div className="space-y-1.5 min-w-0">
                                      <p className="text-xs font-medium">
                                        {finding.insight}
                                      </p>
                                      {finding.evidence.length > 0 && (
                                        <div className="pl-3 border-l border-neutral-200 dark:border-neutral-700 space-y-1">
                                          {finding.evidence.map(
                                            (solution: string, k: number) => (
                                              <p
                                                key={`gap-solution-${k}`}
                                                className="text-[11px] text-neutral-500"
                                              >
                                                {solution}
                                              </p>
                                            ),
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}

                        {analysis.type === 'synthesis' && (
                          <div className="grid gap-2.5">
                            {analysis.findings &&
                              analysis.findings.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-[11px] font-medium text-neutral-600 px-1">
                                    Key Findings
                                  </h4>
                                  <div className="grid gap-1.5">
                                    {analysis.findings.map(
                                      (
                                        finding: AnalysisFindingItem,
                                        j: number,
                                      ) => (
                                        <div
                                          key={`synth-finding-${j}`}
                                          className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700"
                                        >
                                          <div className="flex items-start gap-1.5 sm:gap-2">
                                            <div className="flex-shrink-0 mt-1">
                                              <div className="w-1 h-1 rounded-full bg-green-500" />
                                            </div>
                                            <div className="space-y-1.5 min-w-0">
                                              <p className="text-[11px] sm:text-xs font-medium leading-normal">
                                                {finding.insight}
                                              </p>
                                              {finding.evidence.length > 0 && (
                                                <div className="pl-2 sm:pl-3 border-l border-neutral-200 dark:border-neutral-700 space-y-1">
                                                  {finding.evidence.map(
                                                    (
                                                      evidence: string,
                                                      k: number,
                                                    ) => (
                                                      <p
                                                        key={`synth-evidence-${k}`}
                                                        className="text-[10px] sm:text-[11px] text-neutral-500 leading-normal"
                                                      >
                                                        {evidence}
                                                      </p>
                                                    ),
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {analysis.uncertainties &&
                              analysis.uncertainties.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-[11px] font-medium text-neutral-600 px-1">
                                    Remaining Uncertainties
                                  </h4>
                                  <div className="grid gap-1.5">
                                    {analysis.uncertainties.map(
                                      (uncertainty: string, j: number) => (
                                        <div
                                          key={`synth-uncertainty-${j}`}
                                          className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700"
                                        >
                                          <p className="text-[11px] sm:text-xs text-neutral-600 leading-normal">
                                            {uncertainty}
                                          </p>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {analysis.recommendations &&
                              analysis.recommendations.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-[11px] font-medium text-neutral-600 px-1">
                                    Recommendations
                                  </h4>
                                  <div className="grid gap-1.5">
                                    {analysis.recommendations.map(
                                      (
                                        rec: AnalysisRecommendationItem,
                                        j: number,
                                      ) => (
                                        <div
                                          key={`synth-rec-${j}`}
                                          className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700"
                                        >
                                          <div className="space-y-1">
                                            <p className="text-[11px] sm:text-xs font-medium leading-normal">
                                              {rec.action}
                                            </p>
                                            <p className="text-[10px] sm:text-[11px] text-neutral-500 leading-normal">
                                              {rec.rationale}
                                            </p>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {analysis.type !== 'gaps' &&
                          analysis.type !== 'synthesis' &&
                          analysis.findings && (
                            <div className="grid gap-1.5">
                              {analysis.findings.map(
                                (finding: AnalysisFindingItem, j: number) => (
                                  <div
                                    key={`generic-finding-${j}`}
                                    className="p-2.5 rounded-lg bg-white dark:bg-black border border-neutral-200 dark:border-neutral-700"
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className="flex-shrink-0 mt-1">
                                        <div className="w-1 h-1 rounded-full bg-primary/80" />
                                      </div>
                                      <div className="space-y-1.5 min-w-0">
                                        <p className="text-xs font-medium">
                                          {finding.insight}
                                        </p>
                                        {finding.evidence.length > 0 && (
                                          <div className="pl-3 border-l border-neutral-200 dark:border-neutral-700 space-y-1">
                                            {finding.evidence.map(
                                              (evidence: string, k: number) => (
                                                <p
                                                  key={`generic-evidence-${k}`}
                                                  className="text-[11px] text-neutral-500"
                                                >
                                                  {evidence}
                                                </p>
                                              ),
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ) : (
              <EmptyState type="analysis" />
            )}
          </AnimatedTabContent>
        </div>
      </Tabs>
    </div>
  );
};
