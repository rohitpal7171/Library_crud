import {
  Card,
  CardContent,
  Grid,
  Tooltip,
  Typography,
  Box,
  Skeleton,
  Link as MuiLink,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { defaultCheckValue } from '../../utils/utils';

const defaultFormatCount = (v) => v;

/**
 * StatCard — generic small stat card with optional tooltip & link
 */
export function StatCard({
  title,
  count = 0,
  loading = false,
  to = '',
  tooltipHtml = '',
  icon: Icon = DescriptionOutlinedIcon,
  borderColor = '#d9d9d9',
  height = 70,
  cardPadding = 2,
  grid = { xs: 12, sm: 6, md: 3 }, // 25% at md and up
  sx = {},
  titleVariant = 'subtitle1',
  countVariant = 'h6',
  formatCount = defaultFormatCount,
  iconColor = 'action',
}) {
  const content = (
    <Card
      variant="outlined"
      sx={{
        borderColor: borderColor || ((theme) => theme.palette.divider),
        borderRadius: 2,
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
              <Box sx={{ display: 'flex' }}>
                <Typography variant={titleVariant} sx={{ ml: 1.5, m: 0 }}>
                  {title}
                </Typography>
                {tooltipHtml && (
                  <Tooltip title={<span dangerouslySetInnerHTML={{ __html: tooltipHtml }} />} arrow>
                    <InfoOutlinedIcon sx={{ ml: 1, mt: 0.5, fontSize: 18, opacity: 0.8 }} />
                  </Tooltip>
                )}
              </Box>
              <Box>
                <Typography
                  variant={countVariant}
                  fontWeight={700}
                  sx={{ color: 'text.secondary' }}
                >
                  {formatCount(count)}
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

/**
 * TextItem — label/value row used by InfoCard (customizable)
 */
export function TextItem({
  label,
  value,
  checkValue = defaultCheckValue,
  labelColor = 'text.secondary',
  zeroFallback = '0',
}) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="body2" sx={{ color: labelColor, fontWeight: 600 }}>
        {label}:&nbsp;
        <Typography component="span" variant="body2" fontWeight={700} color="text.primary">
          {checkValue(value) ? ` ${value}` : ` ${zeroFallback}`}
        </Typography>
      </Typography>
    </Grid>
  );
}

/**
 * InfoCard — card with icon + title + a grid of label/value items
 */
export function InfoCard({
  to = '',
  icon: Icon = DescriptionOutlinedIcon,
  title,
  data = [], // array of { label, value }
  loading = false,
  borderColor,
  bodyPadding = 1,
  cardPadding = 2,
  height = '100%',
  grid = { xs: 12, md: 6 },
  titleVariant = 'subtitle1',
  renderItem,
  itemsSpacing = 1,
  sx = {},
}) {
  const defaultRenderer = (item, idx) => (
    <TextItem key={idx} label={item.label} value={item.value} />
  );

  const content = (
    <Card
      variant="outlined"
      sx={{
        borderColor: borderColor || ((theme) => theme.palette.divider),
        borderRadius: 2,
        p: cardPadding,
        height,
        ...sx,
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {loading ? (
          <>
            <Skeleton variant="text" height={28} width="60%" />
            <Skeleton variant="rounded" height={96} sx={{ mt: 1 }} />
          </>
        ) : (
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {Icon && <Icon sx={{ fontSize: 24 }} />}
                <Typography variant={titleVariant} sx={{ ml: 1.5 }}>
                  {title}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Grid container spacing={itemsSpacing} sx={{ px: bodyPadding }}>
                {data.map(renderItem || defaultRenderer)}
              </Grid>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Grid item {...grid}>
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

/**
 * Example wrapper row usage
 *
 * <Grid container spacing={2}>
 *   <StatCard title="Total Students" count={1234} to="/students" />
 *   <StatCard title="Active" count={1200} icon={CheckCircleOutline} />
 *   <StatCard title="Inactive" count={34} tooltipHtml="<b>Note:</b> last 30 days" />
 *   <StatCard title="Docs" count={48} icon={DescriptionOutlinedIcon} />
 *
 *   <InfoCard
 *     to="/analytics"
 *     title="Insights"
 *     icon={InsightsOutlined}
 *     data={[
 *       { label: 'Seat vs Locker', value: '45 / 30' },
 *       { label: 'Missing Docs', value: 12 },
 *       { label: 'Aadhaar Linked %', value: '86%' },
 *     ]}
 *   />
 * </Grid>
 */

export default { StatCard, InfoCard, TextItem };
