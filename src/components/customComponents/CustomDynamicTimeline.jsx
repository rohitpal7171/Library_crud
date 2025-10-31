import { Edit } from '@mui/icons-material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import { Box, IconButton, Typography } from '@mui/material';

const PALETTE_KEYS = [
  'inherit',
  'primary',
  'secondary',
  'grey',
  'success',
  'info',
  'warning',
  'error',
];

const CustomDynamicTimeline = ({
  events = [],
  position = 'right',
  showTimeOnLeft = false,
  onEditClick,
}) => {
  return (
    <Timeline
      position={position}
      sx={{
        ml: 0,
        p: 0,
        ...(position === 'right' && {
          '& .MuiTimelineItem-root:before': {
            flex: 0,
            padding: 0,
          },
        }),
      }}
    >
      {events.map((event, index) => (
        <TimelineItem key={index}>
          {/* Show time on left if available */}
          {showTimeOnLeft && event.time && (
            <TimelineOppositeContent
              sx={{ m: 'auto 0' }}
              align="right"
              variant="body2"
              color="text.secondary"
            >
              {event.time}
            </TimelineOppositeContent>
          )}

          <TimelineSeparator>
            {/* Main Dot */}
            <TimelineDot
              variant={event.variant || 'filled'}
              {
                ...(event.color && PALETTE_KEYS.includes(event.color)
                  ? { color: event.color } // valid palette key
                  : { sx: { bgcolor: event.color || 'grey.500', color: 'common.white' } }) // hex or custom
              }
            >
              {event.icon}
            </TimelineDot>

            {/* Connector below dot */}
            {index !== events.length - 1 && (
              <TimelineConnector sx={{ bgcolor: event.connectorColor }} />
            )}
          </TimelineSeparator>

          {/* Content */}
          <TimelineContent sx={{ py: '12px', px: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
            >
              <Typography variant="h6" component="span">
                {event.title}
              </Typography>
              <IconButton color="primary" onClick={() => onEditClick?.(event)}>
                <Edit />
              </IconButton>
            </Box>
            <Typography>{event.description}</Typography>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

export default CustomDynamicTimeline;
