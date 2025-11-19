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
import { defaultBoxBorderRadius, getDueDateDisplay } from '../../utils/utils';

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

          const { text, fontWeight } = getDueDateDisplay(
            student?.monthlyBillingLatest?.nextPaymentDate
          );
          return (
            <React.Fragment key={student.id}>
              <ListItem
                alignItems="flex-start"
                disablePadding
                // make the list item a responsive flex container
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: { xs: 1.5, sm: 0 },
                  py: 1.25,
                }}
              >
                {/* left part: avatar + texts */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    gap: 2,
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 'auto' }}>
                    <Avatar
                      alt={student.studentName}
                      sx={{
                        bgcolor: 'primary.main',
                        width: { xs: 40, sm: 48 },
                        height: { xs: 40, sm: 48 },
                        fontSize: { xs: '0.95rem', sm: '1rem' },
                      }}
                    >
                      {initials}
                    </Avatar>
                  </ListItemAvatar>

                  {/* make text area grow so amount doesn't overlap */}
                  <ListItemText
                    primary={
                      student?.studentName ? (
                        <Typography
                          variant="body1"
                          sx={{
                            textTransform: 'capitalize',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: { xs: 'calc(100vw - 160px)', sm: 'calc(100% - 200px)' },
                          }}
                        >
                          {student.studentName}
                        </Typography>
                      ) : (
                        'Unnamed Student'
                      )
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: { xs: 'calc(100vw - 160px)', sm: '100%' },
                        }}
                      >
                        {student.phoneNumber || 'No phone number'}
                      </Typography>
                    }
                  />
                </Box>

                {/* right / bottom part: amount + due date */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: { xs: 'flex-start', sm: 'flex-end' },
                    mt: { xs: 1, sm: 0 },
                    minWidth: { sm: 120 },
                    gap: 0.5,
                    px: { xs: 1, sm: 0 },
                  }}
                >
                  <Typography
                    color={amountTextColor}
                    fontWeight={500}
                    sx={{
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                    }}
                    onClick={() => handlePaymentClick?.(student)}
                  >
                    ₹{student.due_amount || 0}
                  </Typography>

                  <Typography
                    color="textSecondary"
                    fontWeight={fontWeight}
                    sx={{
                      fontSize: '0.8rem',
                      // allow date text to wrap if needed on very small screens
                      whiteSpace: { xs: 'normal', sm: 'nowrap' },
                      textAlign: { xs: 'left', sm: 'right' },
                      maxWidth: { xs: '100%', sm: '140px' },
                    }}
                  >
                    {text}
                  </Typography>
                </Box>
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
