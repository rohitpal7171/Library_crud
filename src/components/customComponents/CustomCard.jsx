import {
  Card,
  CardContent,
  Grid,
  Tooltip,
  Typography,
  Box,
  Skeleton,
  Link as MuiLink,
  IconButton,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { defaultBorderColor, defaultBoxBorderRadius } from '../../utils/utils';
import { useState } from 'react';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const defaultFormatCount = (v) => v;

export function StatCard({
  title,
  count = 0,
  loading = false,
  to = '',
  tooltipHtml = '',
  icon: Icon = DescriptionOutlinedIcon,
  borderColor = defaultBorderColor,
  height = 70,
  cardPadding = 2,
  grid = { xs: 12, sm: 6, md: 3 }, // 25% at md and up
  sx = {},
  titleVariant = 'subtitle1',
  countVariant = 'h6',
  formatCount = defaultFormatCount,
  iconColor = 'action',
  showVisibleFunctionality = false,
}) {
  const [visible, setVisible] = useState(false);
  const content = (
    <Card
      variant="outlined"
      sx={{
        borderColor: borderColor || ((theme) => theme.palette.divider),
        borderRadius: defaultBoxBorderRadius,
        p: cardPadding,
        height,
        ...sx,
      }}
    >
      <CardContent sx={{ p: 0, height: '100%' }}>
        {loading ? (
          <Skeleton variant="rounded" height={height} />
        ) : (
          <Grid container spacing={2} sx={{ height: '100%' }}>
            {Icon && (
              <Grid size={2}>
                <Icon sx={{ fontSize: 28 }} color={iconColor} />
              </Grid>
            )}
            <Grid size={Icon ? 10 : 12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex' }}>
                  <Typography variant={titleVariant} sx={{ ml: 1.5, m: 0 }}>
                    {title}
                  </Typography>
                  {tooltipHtml && (
                    <Tooltip
                      title={<span dangerouslySetInnerHTML={{ __html: tooltipHtml }} />}
                      arrow
                    >
                      <InfoOutlinedIcon sx={{ ml: 1, mt: 0.5, fontSize: 18, opacity: 0.8 }} />
                    </Tooltip>
                  )}
                </Box>
                {showVisibleFunctionality && (
                  <IconButton size="small" onClick={() => setVisible(!visible)}>
                    {visible ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                )}
              </Box>
              <Box>
                <Typography
                  variant={countVariant}
                  fontWeight={700}
                  sx={{ color: 'text.secondary' }}
                >
                  {showVisibleFunctionality
                    ? !visible
                      ? '****'
                      : formatCount(count)
                    : formatCount(count)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Grid item size={{ ...grid }}>
      {to ? (
        <MuiLink component={RouterLink} to={to} underline="none" color="inherit">
          {content}
        </MuiLink>
      ) : (
        content
      )}
    </Grid>
  );
}

export default { StatCard };
