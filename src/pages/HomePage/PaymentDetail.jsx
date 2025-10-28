import { Fragment, useCallback, useEffect, useState } from 'react';
import { useFirebase } from '../../context/Firebase';
import { useSnackbar } from '../../components/customComponents/CustomNotifications';
import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import HotelIcon from '@mui/icons-material/Hotel';
import RepeatIcon from '@mui/icons-material/Repeat';
import CustomDynamicTimeline from '../../components/customComponents/CustomDynamicTimeline';

// You can pass icons dynamically as React components
const timelineData = [
  {
    time: '9:30 am',
    title: 'Eat',
    description: 'Because you need strength',
    icon: <FastfoodIcon />,
    color: 'default',
  },
  {
    time: '10:00 am',
    title: 'Code',
    description: "Because it's awesome!",
    icon: <LaptopMacIcon />,
    color: 'primary',
  },
  {
    time: '11:30 pm',
    title: 'Sleep',
    description: 'Because you need rest',
    icon: <HotelIcon />,
    color: 'primary',
    variant: 'outlined',
    connectorColor: 'secondary.main',
  },
  {
    time: 'Next Day',
    title: 'Repeat',
    description: 'Because this is the life you love!',
    icon: <RepeatIcon />,
    color: 'success',
  },
];

export const PaymentDetail = ({ open, onClose, student = {}, fetchStudentData, serverFilters }) => {
  const firebaseContext = useFirebase();
  const { showSnackbar } = useSnackbar();

  const [payments, setPayments] = useState([]);

  const fetchPaymentDetails = useCallback(async () => {
    const response = await firebaseContext.getSubcollectionDocumentsByStudentId({
      parentCollection: 'students',
      studentId: student.id,
      subcollectionName: 'monthlyBilling',
    });
    if (response?.docs) {
      setPayments(response.docs);
    }
  }, [firebaseContext, student]);

  useEffect(() => {
    if (!student.id) return;
    fetchPaymentDetails();
  }, [student.id, fetchPaymentDetails]);

  console.log('payments', payments);

  return (
    <Fragment>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: '92%', sm: 480 } } }}
      >
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header Starts */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box>
                <Typography variant="h6">{'Payment Details'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {student.studentName || 'Unknown Student.'}
                </Typography>
              </Box>
            </Stack>

            <IconButton onClick={onClose} aria-label="close">
              <Close />
            </IconButton>
          </Box>
          {/* Header Ends */}
          {/* Body Starts */}
          <Box>
            <CustomDynamicTimeline events={timelineData} />
          </Box>
          {/* Body Ends */}
        </Box>
      </Drawer>
    </Fragment>
  );
};
