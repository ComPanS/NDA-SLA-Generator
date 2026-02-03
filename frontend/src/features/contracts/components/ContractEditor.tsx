import { Paper } from '@mui/material';
import { useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './ContractEditor.css';

interface ContractEditorProps {
  content: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

/**
 * Компонент редактора договоров с Quill.js
 */
export const ContractEditor = ({ content, onChange, readOnly = false }: ContractEditorProps) => {
  const quillRef = useRef<ReactQuill>(null);

  const modules = {
    toolbar: readOnly
      ? false
      : [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ align: [] }],
          ['blockquote', 'code-block'],
          ['link'],
          ['clean'],
        ],
    clipboard: {
      matchVisual: false,
    },
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'indent',
    'align',
    'blockquote',
    'code-block',
    'link',
  ];

  return (
    <Paper
      sx={{
        p: 0,
        '& .ql-container': {
          minHeight: { xs: '320px', sm: '400px', md: '500px' },
          fontSize: '14px',
          fontFamily: '"Times New Roman", serif',
        },
        '& .ql-editor': {
          minHeight: { xs: '320px', sm: '400px', md: '500px' },
          padding: { xs: '12px', sm: '16px', md: '20px' },
          lineHeight: '1.8',
        },
        '& .ql-toolbar': {
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          backgroundColor: '#f5f5f5',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        },
        '& .ql-container.ql-snow': {
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
        },
      }}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={content}
        onChange={onChange}
        readOnly={readOnly}
        modules={modules}
        formats={formats}
        placeholder={readOnly ? '' : 'Содержимое документа...'}
      />
    </Paper>
  );
};
