import type { IWebviewTestcaseIo } from '@cpbuddy/core';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DifferenceIcon from '@mui/icons-material/Difference';
import DoneIcon from '@mui/icons-material/Done';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import Box from '@mui/material/Box';
import { type AnserJsonEntry, ansiToJson } from 'anser';
import debounce from 'lodash/debounce';
import { type CSSProperties, memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextareaAutosize from 'react-textarea-autosize';
import { CPBuddyButton } from '@/components/base/cpbuddyButton';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { CPBuddyLink } from '@/components/base/cpbuddyLink';
import { useProblemDispatch } from '@/context/ProblemContext';

interface OutputActions {
  onSetAnswer: () => void;
  onCompare: () => void;
}

interface CodeMirrorSectionProps {
  label: string;
  value: IWebviewTestcaseIo;
  onChange?: (value: string) => void;
  onChooseFile?: () => void;
  onToggleFile?: () => void;
  onOpenVirtual?: () => void;
  outputActions?: OutputActions;
  readOnly?: boolean;
  autoFocus?: boolean;
  tabIndex?: number;
}

const ansiToReact = (ansi: string) => {
  return (
    <Box
      contentEditable
      suppressContentEditableWarning
      onKeyDown={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      style={{ cursor: 'text', outline: 'none' }}
    >
      {ansiToJson(ansi).map((entry: AnserJsonEntry) => {
        const styles: CSSProperties = {
          color: `rgb(${entry.fg})`,
          backgroundColor: `rgb(${entry.bg})`,
        };
        for (const decoration of entry.decorations) {
          if (decoration === 'bold') {
            styles.fontWeight = 'bold';
          } else if (decoration === 'dim') {
            styles.opacity = 0.5;
          } else if (decoration === 'italic') {
            styles.fontStyle = 'italic';
          } else if (decoration === 'underline') {
            styles.textDecoration = `${styles.textDecoration} underline`.trim();
          } else if (decoration === 'blink') {
            styles.animation = 'blink 1s infinite';
          } else if (decoration === 'reverse') {
            [styles.color, styles.backgroundColor] = [styles.backgroundColor, styles.color];
          } else if (decoration === 'hidden') {
            styles.visibility = 'hidden';
          } else if (decoration === 'strikethrough') {
            styles.textDecoration = `${styles.textDecoration} line-through`.trim();
          }
        }
        return (
          <span key={entry.content} style={styles}>
            {entry.content}
          </span>
        );
      })}
    </Box>
  );
};

export const TestcaseDataView = memo(
  ({
    label,
    value,
    onChange,
    onChooseFile,
    onToggleFile,
    onOpenVirtual,
    outputActions,
    readOnly,
    autoFocus,
    tabIndex,
  }: CodeMirrorSectionProps) => {
    const { t } = useTranslation();
    const dispatch = useProblemDispatch();
    const [copied, setCopied] = useState(false);
    const [internalValue, setInternalValue] = useState(value);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const onChangeRef = useRef(onChange);
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);
    const debouncedOnChange = useMemo(
      () =>
        debounce((val: string) => onChangeRef.current?.(val), 500, {
          leading: false,
          trailing: true,
        }),
      [],
    );
    useEffect(
      () => () => {
        debouncedOnChange.flush();
        debouncedOnChange.cancel();
      },
      [debouncedOnChange],
    );

    useEffect(() => {
      debouncedOnChange.cancel();
      setInternalValue(value);
    }, [debouncedOnChange, value]);

    useEffect(() => {
      if (autoFocus && textareaRef.current) textareaRef.current.focus();
    }, [autoFocus]);

    const commonStyle: CSSProperties = {
      fontFamily: 'var(--vscode-editor-font-family)',
      fontWeight: 'var(--vscode-editor-font-weight)',
      width: '100%',
      overflow: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(127, 127, 127, 0.5) transparent',
      color: 'unset',
      backgroundColor: 'rgba(127, 127, 127, 0.1)',
      border: 'solid 2px rgba(127, 127, 127, 0.2)',
      borderRadius: '4px',
      padding: '4px',
      boxSizing: 'border-box',
      whiteSpace: 'pre',
      outline: 'none',
    };

    if (value.type === 'string' && !value.data && readOnly) return null;
    return (
      <CPBuddyFlex column smallGap>
        <CPBuddyFlex sx={{ justifyContent: 'space-between' }}>
          <CPBuddyFlex sx={{ flex: 1, flexWrap: 'wrap' }}>
            <CPBuddyLink
              sx={{ color: 'inherit', fontSize: 'larger' }}
              name={t('testcaseDataView.openVirtual')}
              onClick={onOpenVirtual}
            >
              {label}
            </CPBuddyLink>
            {internalValue.type === 'file' && !readOnly && (
              <CPBuddyLink
                name={internalValue.path}
                onClick={() => {
                  dispatch({
                    type: 'openFile',
                    path: internalValue.path,
                  });
                }}
              >
                {internalValue.base}
              </CPBuddyLink>
            )}
          </CPBuddyFlex>
          <Box sx={{ display: { xs: 'none', md: 'contents' } }}>
            {!!outputActions && (
              <CPBuddyButton
                name={t('testcaseDataView.compare')}
                icon={DifferenceIcon}
                onClick={outputActions.onCompare}
              />
            )}
            {!!onToggleFile && (
              <CPBuddyButton
                name={t('testcaseDataView.toggleFile')}
                icon={ChangeCircleIcon}
                onClick={onToggleFile}
              />
            )}
          </Box>
          {internalValue.type === 'file' ? (
            readOnly || (
              <CPBuddyButton
                name={t('testcaseDataView.clearFile')}
                icon={ClearIcon}
                onClick={() => {
                  if (onChange) onChange('');
                }}
              />
            )
          ) : (
            <>
              {readOnly || (
                <Box sx={{ display: { xs: 'none', md: 'contents' } }}>
                  <CPBuddyButton
                    name={t('testcaseDataView.loadFile')}
                    icon={FileOpenIcon}
                    onClick={onChooseFile}
                  />
                </Box>
              )}
              {!!outputActions && (
                <CPBuddyButton
                  name={t('testcaseDataView.setAnswer')}
                  icon={ArrowUpwardIcon}
                  onClick={outputActions.onSetAnswer}
                />
              )}
              <CPBuddyButton
                name={copied ? t('testcaseDataView.copied') : t('testcaseDataView.copy')}
                icon={copied ? DoneIcon : ContentCopyIcon}
                onClick={() => {
                  navigator.clipboard
                    .writeText(internalValue.data)
                    .then(() => {
                      setCopied(true);
                      setTimeout(() => {
                        setCopied(false);
                      }, 2000);
                    })
                    .catch((e) => {
                      console.error('Failed to copy code: ', e);
                    });
                }}
              />
            </>
          )}
        </CPBuddyFlex>
        {internalValue.type === 'string' &&
          (readOnly ? (
            <div
              style={{
                ...commonStyle,
                maxHeight: '20em',
              }}
            >
              {ansiToReact(internalValue.data)}
            </div>
          ) : (
            <TextareaAutosize
              ref={textareaRef}
              value={internalValue.data}
              onChange={(e) => {
                const data = e.target.value;
                setInternalValue({
                  type: 'string',
                  data,
                });
                debouncedOnChange(data);
              }}
              tabIndex={tabIndex}
              maxRows={10}
              style={{
                ...commonStyle,
                height: undefined,
                resize: 'none',
              }}
            />
          ))}
      </CPBuddyFlex>
    );
  },
);
