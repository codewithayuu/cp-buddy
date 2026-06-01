import { mock } from '@t/mock';
import type { OutputChannel } from 'vscode';

export const compilationOutputChannelMock = mock<OutputChannel>({ name: 'Mock channel' });
compilationOutputChannelMock.append.mockImplementation((value: string) => {
  console.log('append', value);
});
compilationOutputChannelMock.appendLine.mockImplementation((value: string) => {
  console.log('appendLine', value);
});
compilationOutputChannelMock.replace.mockImplementation((value: string) => {
  console.log('replace', value);
});
compilationOutputChannelMock.clear.mockImplementation(() => {
  console.log('clear');
});
compilationOutputChannelMock.show.mockReturnValue();
compilationOutputChannelMock.hide.mockReturnValue();
compilationOutputChannelMock.dispose.mockReturnValue();
