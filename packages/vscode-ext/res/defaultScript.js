/// <reference path="./cpbuddy.d.ts" />

const process = async () => {
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return 'No workspace folder found';
  }
  let folder = null;
  if (workspaceFolders.length > 1) {
    const selectedFolderName = await ui.chooseItem(
      workspaceFolders.map((f) => f.name),
      'Select a workspace folder to create files in',
    );
    if (selectedFolderName === undefined) {
      return 'No workspace folder selected';
    }
    const selectedFolder = workspaceFolders.find(
      (f) => f.name === selectedFolderName,
    );
    if (!selectedFolder) {
      return 'Selected workspace folder not found';
    }
    folder = selectedFolder.path;
  } else
    folder = workspaceFolders[0].path;

  let ext = settings.problem.defaultLanguage;
  if (!ext || ext === 'ask') {
    const languageChoice = await ui.chooseItem(
      ['cpp', 'c', 'py', 'java', 'js', 'rs', 'go'],
      'Select a language to create the file in'
    );
    if (!languageChoice) {
      return 'Language selection aborted';
    }
    ext = languageChoice;
  }
  
  const results = [];
  logger.debug('Default script started', { problems });
  for (const problem of problems) {
    try {
      const { name, url } = problem;
      logger.debug('Generating filename', { name, url });

      let filename = null;

      if (!filename) {
        const words = name.match(/[\p{L}\p{N}]+/gu);
        const base = words
          ? `${words.join('_')}`
          : `${name.replace(/\W+/g, '_')}`;
        filename = `${base}.${ext}`;
        logger.info('Generated name from problem title', {
          name,
          filename,
        });
      }

      let folderPath = folder;
      if (settings.problem.autoCategorize && url) {
        if (url.includes('codeforces.com/')) {
          folderPath = path.join(folderPath, 'Codeforces');
          if (problem.rating) {
            folderPath = path.join(folderPath, problem.rating.toString());
          }
        } else if (url.includes('leetcode.com/')) {
          folderPath = path.join(folderPath, 'LeetCode');
          if (problem.difficulty) {
            folderPath = path.join(folderPath, problem.difficulty);
          }
        } else if (url.includes('atcoder.jp/')) {
          folderPath = path.join(folderPath, 'AtCoder');
          const contestMatch = url.match(/contests\/([^\/]+)/);
          if (contestMatch) {
            folderPath = path.join(folderPath, contestMatch[1]);
          }
        } else if (url.includes('cses.fi/')) {
          folderPath = path.join(folderPath, 'CSES');
        } else if (url.includes('hackerrank.com/')) {
          folderPath = path.join(folderPath, 'HackerRank');
        }
      }

      logger.debug('Generated filename and path', { filename, folderPath });
      results.push(path.join(folderPath, filename));
    } catch (e) {
      logger.error(
        'Error generating filename for problem',
        e && e.message ? e.message : e,
      );
      results.push(null);
    }
  }

  logger.debug('Default script finished', { results });
  return results;
};
