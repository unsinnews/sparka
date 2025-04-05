import React from 'react';
import { WebToolAction, AcademicToolAction, XToolAction } from './tool-actions';
import type {
  WebSearchUpdate,
  AcademicSearchUpdate,
  XSearchUpdate,
} from '@/lib/ai/tools/research-updates-schema';

// TODO: Make sure these components are used or remove them

// Web updates component
const WebUpdates: React.FC<{ updates: WebSearchUpdate[] }> = ({ updates }) => {
  return (
    <>
      {updates.map((update, updateIndex) => (
        <div key={`web-update-${updateIndex}`} className="space-y-2">
          {update.results?.map((result, resultIndex) => (
            <WebToolAction
              key={`web-${updateIndex}-${resultIndex}`}
              result={result}
            />
          ))}
        </div>
      ))}
    </>
  );
};

// Academic updates component
const AcademicUpdates: React.FC<{ updates: AcademicSearchUpdate[] }> = ({
  updates,
}) => {
  return (
    <>
      {updates.map((update, updateIndex) => (
        <div key={`academic-update-${updateIndex}`} className="space-y-2">
          {update.results?.map((result, resultIndex) => (
            <AcademicToolAction
              key={`academic-${updateIndex}-${resultIndex}`}
              result={result}
            />
          ))}
        </div>
      ))}
    </>
  );
};

// X updates component
const XUpdates: React.FC<{ updates: XSearchUpdate[] }> = ({ updates }) => {
  return (
    <>
      {updates.map((update, updateIndex) => (
        <div key={`x-update-${updateIndex}`} className="space-y-2">
          {update.results?.map((result, resultIndex) => (
            <XToolAction
              key={`x-${updateIndex}-${resultIndex}`}
              result={result}
            />
          ))}
        </div>
      ))}
    </>
  );
};
