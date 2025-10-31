import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Skeleton } from '@mui/material';
import { Empty } from 'antd';
import { defaultBoxBorderRadius } from '../../utils/utils';

export default function MiniStudentList({
  students = [],
  showDividers = true,
  loading = true,
  handlePaymentClick,
  amountTextColor = 'primary.main',
}) {
  if (loading)
    return (
      <Box>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </Box>
    );
  return (
    <List
      sx={{
        bgcolor: 'background.paper',
        padding: 2,
        maxHeight: '4800px',
        overflow: 'auto',
        borderRadius: defaultBoxBorderRadius,
      }}
    >
      {students.length ? (
        students.map((student, index) => {
          const initials = (student.studentName || 'Student')
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          return (
            <React.Fragment key={student.id}>
              <ListItem
                alignItems="center"
                disablePadding
                secondaryAction={
                  <Box sx={{ pr: 2 }}>
                    <Typography
                      color={amountTextColor}
                      fontWeight={400}
                      sx={{ cursor: 'pointer', mt: 2, textDecoration: 'underline' }}
                      onClick={() => handlePaymentClick?.(student)}
                    >
                      ₹{student.due_amount || 0}
                    </Typography>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar alt={student.studentName} sx={{ bgcolor: 'primary.main' }}>
                    {initials}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    student?.studentName ? (
                      <span style={{ textTransform: 'capitalize' }}>{student.studentName}</span>
                    ) : (
                      'Unnamed Student'
                    )
                  }
                  secondary={student.phoneNumber || 'No phone number'}
                />
              </ListItem>

              {showDividers && index < students.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          );
        })
      ) : (
        <Empty />
      )}
    </List>
  );
}
