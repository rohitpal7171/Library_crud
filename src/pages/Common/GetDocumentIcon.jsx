import React from 'react';
import { Avatar } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const GetDocumentIcon = (document) => {
  if (!document) return <InsertDriveFileIcon />;

  const { mimeType = '', url } = document;

  if (mimeType.startsWith('image/')) {
    return <Avatar src={url ?? ''} />;
  }

  if (mimeType === 'application/pdf') {
    return <PictureAsPdfIcon color="error" />;
  }

  // fallback icon
  return <InsertDriveFileIcon />;
};

export default GetDocumentIcon;
