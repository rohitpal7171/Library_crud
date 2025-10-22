import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { formatDate, formatFileSize } from '../../utils/utils';
import { useState } from 'react';
import { CloudDownloadOutlined, CloudUploadOutlined } from '@mui/icons-material';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';

export default function StudentDetail({ open, onClose, student = {} }) {
  const initials = (student.studentName || 'Student')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [downloading, setDownloading] = useState(false);
  const [, setProgress] = useState({ done: 0, total: 0 });
  const { showSnackbar } = useSnackbar();

  const handleDownloadAll = async () => {
    if (!student?.documents?.length) return;
    setDownloading(true);
    setProgress({ done: 0, total: student?.documents.length, percent: 0 });

    try {
      const zip = new JSZip();
      let filesFetched = 0;

      // 1️⃣ fetch & add files to zip
      await Promise.all(
        student.documents.map(async (doc, idx) => {
          try {
            const res = await fetch(doc.url, { mode: 'cors' });
            const blob = await res.blob();
            const fileName = doc.originalName?.replace(/\s+/g, '_') || `file_${idx + 1}`;
            zip.file(fileName, blob);
            // update progress for fetched files
            filesFetched += 1;
            setProgress((prev) => ({
              ...prev,
              done: prev.done + 1,
            }));
          } catch (err) {
            console.error('Error fetching file:', err);
          }
        })
      );

      // 2️⃣ generate zip blob (with compression progress)
      const content = await zip.generateAsync({ type: 'blob' }, (meta) => {
        setProgress((prev) => ({
          ...prev,
          percent: meta?.percent,
        }));
      });
      // 3️⃣ save it
      saveAs(content, `${student?.studentName ?? 'documents'}_files.zip`);
      showSnackbar({
        severity: 'success',
        message: `Downloaded ${filesFetched}/${student.documents.length} documents successfully!`,
      });
    } catch (error) {
      setDownloading(false);
      console.error('Download all error:', error);
    } finally {
      setDownloading(false);
      setProgress({ done: 0, total: 0, percent: 0 });
    }
  };

  const info = [
    { label: 'Student Name', value: student.studentName || '—' },
    { label: 'Father Name', value: student.fatherName || '—' },
    { label: 'Date of Birth', value: formatDate(student.dateOfBirth) },
    { label: 'Date of Joining', value: formatDate(student.dateOfJoining) },
    { label: 'Gender', value: student.gender || '—' },
    { label: 'Phone Number', value: student.phoneNumber || '—' },
    { label: 'Referred By', value: student.referredBy || '—' },
    { label: 'Timings', value: student.timings || '—' },
    {
      label: 'Seat',
      value: student.seatReserved ? `Reserved • #${student.seatNumber || '—'}` : 'Not reserved',
    },
    {
      label: 'Locker',
      value: student.locker ? `Assigned • #${student.lockerNumber || '—'}` : 'No locker',
    },
    { label: 'Folder Id', value: student.id || '—' },
    { label: 'Address', value: student.address || '—' },
  ];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '92%', sm: 480 } } }}
    >
      <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              alt={initials}
              src={student?.studentProfile ? student?.studentProfile : initials}
              sx={{ width: 50, height: 50, bgcolor: 'primary.main', fontSize: 24 }}
            />
            <Box>
              <Typography variant="h6">{student.studentName || 'Unnamed Student'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {student.studentProfile || 'No profile description provided.'}
              </Typography>
            </Box>
          </Stack>

          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 1 }} />

        {/* Info Section */}
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {info.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1,
                px: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, flex: 1 }}>
                {item.label}
              </Typography>
              <Typography variant="body1" color="text.primary" sx={{ flex: 1, textAlign: 'right' }}>
                {item.value}
              </Typography>
            </Box>
          ))}

          {/* Documents Section */}
          <Box sx={{ px: 1.5, py: 2, mt: 2 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                Documents
              </Typography>
              <Box>
                <Tooltip title="Download all images">
                  <IconButton
                    onClick={handleDownloadAll}
                    disabled={!student?.documents?.length || downloading}
                    aria-label="Download all documents"
                    loading={downloading}
                  >
                    <CloudDownloadOutlined />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Upload all images">
                  <IconButton
                    // onClick={handleDownloadAll}
                    // disabled={!student?.documents?.length}
                    disabled
                    aria-label="Upload all documents"
                  >
                    <CloudUploadOutlined />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            {student?.documents && student?.documents?.length ? (
              <List dense={true}>
                {student?.documents?.map((doc, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar src={doc?.url ?? ''} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={doc?.originalName ?? 'Unknown Document'}
                      secondary={formatFileSize(doc?.size)}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No documents uploaded
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ mt: 1 }} />

        {/* Footer */}
        {/* <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'space-between' }}>
          <Tooltip title="Edit student">
            <Chip label="Edit" clickable />
          </Tooltip>
        </Box> */}
      </Box>
    </Drawer>
  );
}
