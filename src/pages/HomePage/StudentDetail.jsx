import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import CustomButton from '../../components/customComponents/CustomButton';

const formatDate = (s) => {
  if (!s) return '—';
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    console.log('error while formatting date', e);
    return s;
  }
};

export default function StudentDetail({ open, onClose, student = {} }) {
  const initials = (student.studentName || 'Student')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
          <Box sx={{ px: 1.5, py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
              Documents
            </Typography>
            {student.documents && student.documents.length ? (
              <Stack direction="row" gap={1} flexWrap="wrap">
                {student.documents.map((doc, idx) => (
                  <Chip
                    key={idx}
                    icon={<DocumentScannerIcon />}
                    label={doc}
                    size="small"
                    clickable
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Stack>
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
