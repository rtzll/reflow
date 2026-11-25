import {
  Badge,
  Banner,
  BannerAction,
  BannerActions,
  BannerDescription,
  BannerTitle,
  Button,
  Calendar,
  Card,
  CardButton,
  CardContent,
  CardDescription,
  CardFeature,
  CardFooter,
  CardGroup,
  CardHeader,
  CardImage,
  CardMedia,
  CardTitle,
  ColorPicker,
  DatePicker,
  Icon,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@rtzll/reflow'
import { Markdown } from '@rtzll/reflow/markdown'
import { on, type Handle, type RemixNode } from 'remix/component'
import type { ExampleImages } from '../../assets.ts'
import { AvatarDemo } from '../avatar-example.tsx'
import { BannerMockPage, bannerStatuses } from '../banner-example.tsx'
import { BarChartVariants } from '../bar-chart-series-example.tsx'
import { BuildTimings } from '../build-timings.tsx'
import { CodeBlockDemo } from '../code-block-example.tsx'
import {
  badgeColorNames,
  badgeGenres,
  cardBanner,
  cardItems,
  cardThumb,
  datePickerBooked,
  datePickerOffset,
  datePickerPresets,
  datePickerToday,
  markdownFence,
  markdownImages,
  markdownTable,
} from '../component-example-data.ts'
import { StudioBookings } from '../studio-bookings.tsx'
import { ReleaseWeek } from '../time-grid-week-example.tsx'

export const displayDemoSlugs = new Set([
  'avatar',
  'badge',
  'banner',
  'bar-chart',
  'calendar',
  'card',
  'code-block',
  'color-picker',
  'date-picker',
  'markdown',
  'progress',
  'table',
  'time-grid',
])

export function DisplayDemos(
  handle: Handle<{ slug: string; variant: string; images: ExampleImages }>,
) {
  let selection = 'free'
  let promoDismissed = false
  let color = '#6B97FF'
  let fill = '#6B97FF'

  const select = (value: string) => {
    selection = value
    handle.update()
  }

  return () => {
    const { slug, variant, images } = handle.props
    switch (slug) {
      case 'avatar':
        return <AvatarDemo variant={variant} image={images.sidebarAvatar} />
      case 'badge': {
        const samples = variant === 'colors' ? badgeColorNames : badgeGenres
        const treatments =
          variant === 'colors'
            ? (['solid', 'dot'] as const)
            : ([variant === 'dot' ? 'dot' : 'solid'] as const)
        return (
          <div class="doc-demo-stack">
            {treatments.map((treatment) => (
              <div class="doc-demo-row" key={treatment}>
                {samples.map(([color, text]) => (
                  <Badge key={color} color={color} variant={treatment}>
                    {text}
                  </Badge>
                ))}
              </div>
            ))}
          </div>
        )
      }
      case 'banner': {
        if (variant === 'fixed')
          return (
            <BannerMockPage height={300}>
              <Banner variant="fixed" status="warning" dismissible>
                <BannerTitle>Registry maintenance tonight at 22:00 UTC</BannerTitle>
                <BannerActions>
                  <BannerAction>Details</BannerAction>
                </BannerActions>
              </Banner>
            </BannerMockPage>
          )
        if (variant === 'custom-icon')
          return (
            <div class="banner-action-examples">
              <Banner icon={<Icon name="bell" />}>
                <BannerTitle>3 new components since your last visit</BannerTitle>
              </Banner>
            </div>
          )
        if (variant === 'statuses')
          return (
            <div class="banner-statuses">
              {(['low', 'high'] as const).map((contrast) => (
                <div class="banner-status-column" key={contrast}>
                  <small>{contrast === 'low' ? 'Low contrast' : 'High contrast'}</small>
                  {bannerStatuses.map((status) => (
                    <Banner key={status} status={status} contrast={contrast}>
                      <BannerTitle>{status[0].toUpperCase() + status.slice(1)}</BannerTitle>
                    </Banner>
                  ))}
                </div>
              ))}
            </div>
          )
        return (
          <div class="banner-action-examples">
            <Banner status="info">
              <BannerTitle>Enjoying Reflow?</BannerTitle>
              <BannerActions>
                <BannerAction variant="primary">Star on GitHub</BannerAction>
                <BannerAction>Share</BannerAction>
                <BannerAction variant="ghost">Later</BannerAction>
              </BannerActions>
            </Banner>
            <Banner status="info">
              <BannerTitle>The registry has new components</BannerTitle>
              <BannerDescription>
                Run the install command again to pull the latest versions.
              </BannerDescription>
              <BannerActions>
                <BannerAction variant="primary">Copy command</BannerAction>
                <BannerAction>What's new</BannerAction>
                <BannerAction variant="ghost">Later</BannerAction>
              </BannerActions>
            </Banner>
          </div>
        )
      }
      case 'bar-chart':
        return variant === 'timings' ? <BuildTimings /> : <BarChartVariants variant={variant} />
      case 'calendar': {
        const calendarToday = datePickerToday()
        const calendarMonth = `${calendarToday.slice(0, 8)}01`
        if (variant === 'size')
          return (
            <div class="doc-calendar-prices">
              <Calendar
                defaultMonth={calendarMonth}
                defaultValue={calendarToday}
                cellSize={56}
                dayDetail={(date) => {
                  const rate = 99 + ((Number(date.slice(-2)) * 7) % 10) * 10
                  return (
                    <span style={{ color: rate <= 119 ? 'var(--rf-success)' : undefined }}>
                      ${rate}
                    </span>
                  )
                }}
              />
            </div>
          )
        return (
          <Calendar
            defaultMonth={calendarMonth}
            mode={
              variant === 'range' || variant === 'stacked' || variant === 'booked'
                ? 'range'
                : 'single'
            }
            numberOfMonths={variant === 'range' || variant === 'stacked' ? 2 : 1}
            orientation={variant === 'stacked' ? 'vertical' : 'horizontal'}
            defaultValue={variant === 'single' || variant === 'weeks' ? calendarToday : undefined}
            showWeekNumbers={variant === 'weeks'}
            weekStartsOn={variant === 'weeks' ? 1 : 0}
            min={variant === 'booked' ? calendarToday : undefined}
            booked={
              variant === 'booked'
                ? [4, 5, 6, 12, 19, 20].map((days) => datePickerOffset(calendarToday, days))
                : undefined
            }
            isDateDisabled={
              variant === 'booked'
                ? (value) => new Date(value).getUTCDay() === 0
                : variant === 'available'
                  ? (value) => [0, 6].includes(new Date(value).getUTCDay())
                  : undefined
            }
          />
        )
      }
      case 'card': {
        const frame = (maxWidth: string, children: RemixNode) => (
          <div style={{ width: '100%', maxWidth }}>{children}</div>
        )
        const features = cardItems.slice(0, 4)
        const title = (item: { title: string; description: string }) => (
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
        )
        if (variant === 'composition') {
          if (promoDismissed)
            return (
              <button
                type="button"
                class="doc-demo-restore"
                mix={on('click', () => {
                  promoDismissed = false
                  handle.update()
                })}
              >
                Restore card
              </button>
            )
          return frame(
            '300px',
            <Card
              border="outlined"
              dismissible
              onDismiss={() => {
                promoDismissed = true
                handle.update()
              }}
            >
              <CardImage src={cardBanner} alt="" />
              <CardHeader>
                <CardTitle>Meet the new Card component</CardTitle>
              </CardHeader>
              <CardContent class="doc-card-features">
                <CardFeature
                  icon="paintbrush"
                  title="Always pixel-perfect"
                  description="Renders your design exactly — token-driven and crisp in light and dark, at any radius"
                />
                <CardFeature
                  icon="square-library"
                  title="Stacked, inline, or grid"
                  description="One compositional API — borderless by default, with separated tiles or a shared frame"
                />
              </CardContent>
              <CardFooter>
                <CardButton variant="primary">Get started</CardButton>
                <CardButton variant="ghost">Learn more</CardButton>
              </CardFooter>
            </Card>,
          )
        }
        if (variant === 'grid')
          return frame(
            '560px',
            <CardGroup columns={2} border="outlined" separated>
              {features.map((item) => (
                <Card key={item.title} label={item.title} onClick={() => {}}>
                  <CardImage src={cardBanner} alt="" />
                  {title(item)}
                  <CardFooter>
                    <CardButton variant="primary">Get started</CardButton>
                    <CardButton variant="secondary">Learn more</CardButton>
                  </CardFooter>
                </Card>
              ))}
            </CardGroup>,
          )
        if (variant === 'outlined')
          return frame(
            '520px',
            <CardGroup orientation="inline" border="outlined">
              {features.map((item) => (
                <Card key={item.title} label={item.title} onClick={() => {}}>
                  <CardMedia logo={cardThumb} />
                  {title(item)}
                  <CardFooter>
                    <CardButton variant="primary">Get started</CardButton>
                  </CardFooter>
                </Card>
              ))}
            </CardGroup>,
          )
        if (variant === 'separated')
          return frame(
            '560px',
            <CardGroup orientation="inline" separated>
              {features.map((item) => (
                <Card key={item.title} label={item.title} onClick={() => {}}>
                  <CardImage src={cardBanner} alt="" />
                  {title(item)}
                  <CardFooter>
                    <CardButton variant="primary">Get started</CardButton>
                    <CardButton variant="secondary">Learn more</CardButton>
                    <CardButton>Connect</CardButton>
                  </CardFooter>
                </Card>
              ))}
            </CardGroup>,
          )
        if (variant === 'selected')
          return frame(
            '520px',
            <CardGroup orientation="inline">
              {features.map((item) => (
                <Card
                  key={item.title}
                  label={item.title}
                  selected={
                    selection === item.title ||
                    (selection === 'free' && item.title === features[1].title)
                  }
                  onClick={() => select(item.title)}
                >
                  <CardMedia treatment="icon">
                    <Icon name={item.icon} size={18} />
                  </CardMedia>
                  {title(item)}
                </Card>
              ))}
            </CardGroup>,
          )
        return frame(
          '520px',
          <CardGroup orientation="inline">
            {features.map((item) => (
              <Card key={item.title} label={item.title} onClick={() => {}}>
                <CardMedia treatment="icon">
                  <Icon name={item.icon} size={18} />
                </CardMedia>
                {title(item)}
                <CardFooter>
                  <CardButton>Connect</CardButton>
                </CardFooter>
              </Card>
            ))}
          </CardGroup>,
        )
      }
      case 'code-block':
        return <CodeBlockDemo variant={variant} samples={images.code} />
      case 'color-picker':
        if (variant === 'removable') {
          return fill ? (
            <ColorPicker
              value={fill}
              variant="popover"
              triggerLabel="Fill"
              triggerShowRemove
              onTriggerRemove={() => {
                fill = ''
                handle.update()
              }}
              onValueChange={(value) => {
                fill = value
                handle.update()
              }}
            />
          ) : (
            <Button
              variant="tertiary"
              mix={on('click', () => {
                fill = '#6B97FF'
                handle.update()
              })}
            >
              + Add fill
            </Button>
          )
        }
        return (
          <div class="doc-demo-stack">
            <ColorPicker
              {...(variant === 'controlled' ? { value: color } : { defaultValue: '#6B97FF' })}
              onValueChange={(value) => {
                color = value
                handle.update()
              }}
              variant={variant === 'popover' ? 'popover' : 'inline'}
              triggerLabel="Fill"
              defaultFormat={variant === 'oklch' ? 'oklch' : 'hex'}
              swatches={
                variant === 'swatches'
                  ? [
                      '#000000',
                      '#FFFFFF',
                      '#FF3B30',
                      '#F0F0F0',
                      '#E5E5E5',
                      '#D0D0D0',
                      'rgba(0,0,0,0.5)',
                    ]
                  : undefined
              }
            />
            {variant === 'controlled' && <output class="doc-demo-feedback">{color}</output>}
          </div>
        )
      case 'date-picker': {
        const today = datePickerToday()
        const range = ['presets', 'booked'].includes(variant)
        return (
          <DatePicker
            label={
              variant === 'booked'
                ? 'Stay dates'
                : range
                  ? 'Travel dates'
                  : variant === 'time'
                    ? 'Meeting'
                    : variant === 'timeStep'
                      ? 'Deadline'
                      : 'Start date'
            }
            variant={variant === 'time' ? 'ghost' : 'outline'}
            mode={range ? 'range' : 'single'}
            numberOfMonths={range ? 2 : 1}
            timeRange={variant === 'time'}
            time={variant === 'timeStep'}
            defaultTime="11:00"
            defaultEndTime="12:45"
            defaultValue={variant === 'time' ? today : undefined}
            presets={variant === 'presets' ? datePickerPresets(today) : undefined}
            placeholder={variant === 'booked' ? 'Check in → check out' : undefined}
            booked={variant === 'booked' ? datePickerBooked(today) : undefined}
            min={variant === 'booked' ? today : undefined}
          />
        )
      }
      case 'markdown':
        if (variant === 'images')
          return <Markdown source={markdownImages(images.thinkingPreview ?? '')} images />
        return <Markdown source={variant === 'table' ? markdownTable : markdownFence} />
      case 'progress':
        return (
          <div style={{ width: 'min(100%, 280px)' }}>
            <Progress label="Preparing files" />
          </div>
        )
      case 'table':
        return (
          <div class="doc-demo-fill">
            <Table>
              <TableHeader>
                <TableRow hover={false}>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variant === 'empty' ? (
                  <TableEmpty
                    colSpan={3}
                    title="No members yet"
                    description="People you invite show up here."
                    action={
                      <Button variant="secondary" size="compact">
                        Invite people
                      </Button>
                    }
                  />
                ) : (
                  <>
                    <TableRow selected={variant === 'selected'}>
                      <TableCell>Alice</TableCell>
                      <TableCell>Engineer</TableCell>
                      <TableCell>Active</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Bob</TableCell>
                      <TableCell>Designer</TableCell>
                      <TableCell>Away</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Carol</TableCell>
                      <TableCell>Manager</TableCell>
                      <TableCell>Active</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        )
      case 'time-grid':
        return variant === 'week' ? <ReleaseWeek /> : <StudioBookings />
    }
    return null
  }
}
