import { cardBanner, cardItems, cardThumb } from './component-example-data.ts'
import type { PlaygroundValues } from './doc-playground.tsx'

export function cardPlaygroundCode(values: PlaygroundValues) {
  const inline = values.orientation === 'inline'
  const columns = inline ? 1 : Number(values.columns)
  return `const features = ${JSON.stringify(cardItems.slice(0, columns === 3 ? 6 : 4), null, 2)} as const

<CardGroup orientation="${inline ? 'inline' : 'card'}" columns={${columns}} border="${values.border}" separated={${values.separated}} fluidHover={${values.fluidHover}}>
  {features.map(({ icon, title, description }) => (
    <Card key={title} label={title}${values.selected ? ' selected={plan === title}' : ''} onClick={() => select(title)}>
      ${inline && values.media ? '<CardMedia treatment="icon"><Icon name={icon} size={18} /></CardMedia>\n      ' : ''}<CardHeader>
        ${!inline && values.media ? '<CardMedia treatment="icon"><Icon name={icon} size={18} /></CardMedia>\n        ' : ''}<CardTitle>{title}</CardTitle>${values.description ? '\n        <CardDescription>{description}</CardDescription>' : ''}
      </CardHeader>
    </Card>
  ))}
</CardGroup>`
}

const features = `const features = ${JSON.stringify(cardItems.slice(0, 4), null, 2)} as const`
const banner = `const banner = ${JSON.stringify(cardBanner)}`
const thumb = `const thumb = ${JSON.stringify(cardThumb)}`
const header = `      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>`

export const cardBasicCode = `${features}

<div style={{ width: '100%', maxWidth: '520px' }}>
  <CardGroup orientation="inline">
    {features.map(({ icon, title, description }) => (
      <Card key={title} label={title} onClick={() => open(title)}>
        <CardMedia treatment="icon"><Icon name={icon} size={18} /></CardMedia>
${header}
        <CardFooter><CardButton>Connect</CardButton></CardFooter>
      </Card>
    ))}
  </CardGroup>
</div>`

export const cardGridCode = `${features}
${banner}

<div style={{ width: '100%', maxWidth: '560px' }}>
  <CardGroup columns={2} border="outlined" separated>
    {features.map(({ title, description }) => (
      <Card key={title} label={title} onClick={() => open(title)}>
        <CardImage src={banner} alt="" />
${header}
        <CardFooter>
          <CardButton variant="primary">Get started</CardButton>
          <CardButton variant="secondary">Learn more</CardButton>
        </CardFooter>
      </Card>
    ))}
  </CardGroup>
</div>`

export const cardOutlinedCode = `${features}
${thumb}

<div style={{ width: '100%', maxWidth: '520px' }}>
  <CardGroup orientation="inline" border="outlined">
    {features.map(({ title, description }) => (
      <Card key={title} label={title} onClick={() => open(title)}>
        <CardMedia logo={thumb} />
${header}
        <CardFooter><CardButton variant="primary">Get started</CardButton></CardFooter>
      </Card>
    ))}
  </CardGroup>
</div>`

export const cardSeparatedCode = `${features}
${banner}

<div style={{ width: '100%', maxWidth: '560px' }}>
  <CardGroup orientation="inline" separated>
    {features.map(({ title, description }) => (
      <Card key={title} label={title} onClick={() => open(title)}>
        <CardImage src={banner} alt="" />
${header}
        <CardFooter>
          <CardButton variant="primary">Get started</CardButton>
          <CardButton variant="secondary">Learn more</CardButton>
          <CardButton>Connect</CardButton>
        </CardFooter>
      </Card>
    ))}
  </CardGroup>
</div>`

export const cardSelectedCode = `${features}

const [selected, setSelected] = useState('Accessible by default')

<div style={{ width: '100%', maxWidth: '520px' }}>
  <CardGroup orientation="inline">
    {features.map(({ icon, title, description }) => (
      <Card key={title} label={title} selected={selected === title} onClick={() => setSelected(title)}>
        <CardMedia treatment="icon"><Icon name={icon} size={18} /></CardMedia>
${header}
      </Card>
    ))}
  </CardGroup>
</div>`

export const cardCompositionCode = `${banner}

<div style={{ width: '100%', maxWidth: '300px' }}>
  <Card border="outlined" dismissible onDismiss={() => {}}>
    <CardImage src={banner} alt="" />
    <CardHeader><CardTitle>Meet the new Card component</CardTitle></CardHeader>
    <CardContent>
      <CardFeature icon="paintbrush" title="Always pixel-perfect"
        description="Renders your design exactly — token-driven and crisp in light and dark, at any radius" />
      <CardFeature icon="square-library" title="Stacked, inline, or grid"
        description="One compositional API — borderless by default, with separated tiles or a shared frame" />
    </CardContent>
    <CardFooter>
      <CardButton variant="primary">Get started</CardButton>
      <CardButton variant="ghost">Learn more</CardButton>
    </CardFooter>
  </Card>
</div>`
