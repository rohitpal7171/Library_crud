import { useState } from 'react';
import { Dialog, DialogTitle, IconButton, Box, DialogContent, DialogActions } from '@mui/material';
import { Close } from '@mui/icons-material';
import { InboxOutlined } from '@ant-design/icons';
import { Upload, message } from 'antd';
import CustomButton from '../../components/customComponents/CustomButton';

const { Dragger } = Upload;

export const UploadDocuments = ({
  open,
  handleClose,
  handleUploadAll,
  uploading,
  setUploading,
}) => {
  const [fileList, setFileList] = useState([]);

  const draggerProps = {
    name: 'files',
    multiple: true,
    fileList,
    accept: 'image/*',
    listType: 'picture',
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error(`${file.name} is not a valid image file.`);
        return Upload.LIST_IGNORE;
      }

      const isLt5MB = file.size / 1024 / 1024 < 5;
      if (!isLt5MB) {
        message.error(`${file.name} exceeds 5MB size limit.`);
        return Upload.LIST_IGNORE;
      }

      if (fileList.length >= 5) {
        message.warning('You can upload a maximum of 5 images.');
        return Upload.LIST_IGNORE;
      }

      setFileList((prev) => [...prev, file]);
      return false; // prevent auto upload
    },
    onRemove: (file) => {
      setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    },
  };

  const handleSubmit = () => {
    setUploading(true);
    handleUploadAll?.(fileList);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
    >
      <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>Upload Images</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <Close />
      </IconButton>

      <DialogContent>
        <Box sx={{ p: 3 }}>
          <Dragger {...draggerProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag image files to this area to upload</p>
            <p className="ant-upload-hint">
              You can upload up to 5 images (JPG, PNG, etc.) — Max size 5MB each.
            </p>
          </Dragger>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <CustomButton variant="outlined" colorType="danger" onClick={() => handleClose()}>
          Close
        </CustomButton>

        <CustomButton
          variant="contained"
          disabled={uploading}
          loading={uploading}
          onClick={() => handleSubmit()}
        >
          {'Upload'}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
};
