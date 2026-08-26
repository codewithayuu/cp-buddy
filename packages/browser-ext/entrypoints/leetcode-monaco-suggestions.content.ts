import { defineContentScript } from 'wxt/utils/define-content-script';

export default defineContentScript({
  matches: ['*://*.leetcode.com/*'],
  world: 'MAIN',
  runAt: 'document_idle',
  main() {
    let snippetsRegistered = false;

    const cppKeywords = [
      'vector', 'string', 'map', 'set', 'unordered_map', 'unordered_set', 
      'priority_queue', 'queue', 'stack', 'deque', 'list', 'pair', 'tuple',
      'sort', 'reverse', 'min', 'max', 'swap', 'lower_bound', 'upper_bound',
      'binary_search', 'accumulate', 'count', 'find', 'next_permutation',
      'push_back', 'pop_back', 'push', 'pop', 'top', 'front', 'back', 'empty', 'size',
      'begin', 'end', 'rbegin', 'rend', 'insert', 'erase', 'clear',
      'first', 'second', 'make_pair', 'tie',
      'cout', 'cin', 'endl', 'ios_base::sync_with_stdio(false); cin.tie(NULL);',
      'long long', 'int64_t', 'size_t'
    ];

    const applyOptions = (editor: any) => {
      try {
        editor.updateOptions({
          quickSuggestions: { other: true, comments: true, strings: true },
          suggestOnTriggerCharacters: true,
          parameterHints: { enabled: true },
          wordBasedSuggestions: 'allDocuments',
          inlineSuggest: { enabled: true },
          suggest: { showWords: true, showSnippets: true }
        });
      } catch (e) {}
    };

    const tryUnlock = () => {
      try {
        const monaco = (window as any).monaco;
        if (!monaco) return;

        // 1. Register Snippets
        if (!snippetsRegistered && monaco.languages && monaco.languages.registerCompletionItemProvider) {
          const provider = {
            provideCompletionItems: (model: any, position: any) => {
              const word = model.getWordUntilPosition(position);
              const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
              };
              
              const suggestions: any[] = cppKeywords.map(k => ({
                label: k,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: k,
                range: range
              }));

              suggestions.push({
                label: 'for loop (0 to n)',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n\t$0\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Standard for loop',
                range: range
              });
              suggestions.push({
                label: 'for-each loop',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'for (auto& ${1:x} : ${2:arr}) {\n\t$0\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Range-based for loop',
                range: range
              });
              suggestions.push({
                label: 'while testcases loop',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'int t; cin >> t;\nwhile (t--) {\n\t$0\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'While loop for testcases',
                range: range
              });

              return { suggestions };
            }
          };
          monaco.languages.registerCompletionItemProvider('cpp', provider);
          monaco.languages.registerCompletionItemProvider('c', provider);
          snippetsRegistered = true;
        }

        // 2. Unlock Existing Editors & Block Disabling
        if (monaco.editor && monaco.editor.getEditors) {
          const editors = monaco.editor.getEditors();
          editors.forEach((editor: any) => {
            if (!editor._cpbuddyHooked) {
              applyOptions(editor);
              const origUpdate = editor.updateOptions;
              editor.updateOptions = function(opts: any) {
                if (opts && (opts.quickSuggestions === false || opts.suggestOnTriggerCharacters === false)) {
                   opts.quickSuggestions = { other: true, comments: true, strings: true };
                   opts.suggestOnTriggerCharacters = true;
                }
                return origUpdate.apply(this, arguments);
              };
              editor._cpbuddyHooked = true;
            }
          });
        }

        // 3. Intercept Future Editors
        if (monaco.editor && monaco.editor.create && !monaco.editor._cpbuddyCreateHooked) {
          const originalCreate = monaco.editor.create;
          monaco.editor.create = function(domElement: any, options: any, override: any) {
             if (options) {
                 options.quickSuggestions = { other: true, comments: true, strings: true };
                 options.suggestOnTriggerCharacters = true;
                 options.wordBasedSuggestions = 'allDocuments';
             }
             const editor = originalCreate.apply(this, arguments);
             setTimeout(() => applyOptions(editor), 500);
             return editor;
          };
          monaco.editor._cpbuddyCreateHooked = true;
        }

      } catch (e) {
        console.error("CPBuddy Monaco Unlocker Error:", e);
      }
    };

    // Run aggressively every second to catch editor mounts and react re-renders
    setInterval(tryUnlock, 1000);
  }
});
