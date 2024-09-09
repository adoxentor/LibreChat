import React from 'react';

interface ExtendedClipboardEvent extends React.ClipboardEvent<HTMLTextAreaElement> {
  originalEvent?: {
    clipboardData?: DataTransfer;
  };
}

export function handlePasteAsPlainText(
  event: ExtendedClipboardEvent,
  textAreaRef: React.RefObject<HTMLTextAreaElement>,
  setEditedText: React.Dispatch<React.SetStateAction<string>>,
) {
  event.preventDefault();
  console.log('Paste as plain text event triggered');

  let text = '';
  // Get pasted text from various possible sources
  if (event.clipboardData || event.originalEvent?.clipboardData) {
    text = (event.originalEvent?.clipboardData || event.clipboardData).getData('text/plain');
    console.log('Plain text obtained from clipboardData');
  }
  // else if (window.clipboardData !== undefined) {//todo:support IE 11?
  //   text = window.clipboardData.getData('Text');
  //   console.log('Plain text obtained from window.clipboardData');
  // }
  else {
    console.log('Unable to obtain pasted plain text from clipboard');
  }

  console.log('Pasted plain text:', text);

  const textArea = textAreaRef.current;
  if (!textArea) {
    console.log('TextArea ref is null');
    return;
  }

  // Check if document.queryCommandSupported exists
  const supportsQueryCommand = typeof document.queryCommandSupported === 'function';

  // Try to use execCommand for better undo/redo support
  if (supportsQueryCommand && document.queryCommandSupported('insertText')) {
    console.log('Using insertText command for plain text');
    document.execCommand('insertText', false, text);
    console.log('Plain text inserted using insertText command');
  } else if (supportsQueryCommand && document.queryCommandSupported('paste')) {
    console.log('Using paste command for plain text');
    document.execCommand('paste', false, text);
    console.log('Plain text inserted using paste command');
  } else {
    console.log('ExecCommand not supported, using fallback method for plain text');
    // Fall back to the original implementation if execCommand is not supported
    const start = textArea.selectionStart;
    const end = textArea.selectionEnd;
    const newValue = textArea.value.substring(0, start) + text + textArea.value.substring(end);
    setEditedText(newValue);
    console.log('Plain text inserted using fallback method');
  }

  console.log('Final textarea value after plain text paste:', textArea.value);
}
