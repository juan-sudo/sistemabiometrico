"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Formats the name for display (e.g. "totalUsers" -> "Total users")
const formatName = (name: string, key: string) => {
  return name || key
}

const Chart = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
Chart.displayName = "Chart"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer> & {
    config?: Record<string, any>
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <div data-chart={chartId} ref={ref} className={cn("flex aspect-video justify-center text-xs", className)} {...props}>
      <ChartStyle id={chartId} config={config} />
      <RechartsPrimitive.ResponsiveContainer>
        {children}
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  )
})
ChartContainer.displayName = RechartsPrimitive.ResponsiveContainer.displayName

const ChartStyle = ({ id, config }: { id: string; config: Record<string, any> }) => {
  const colorConfig = Object.entries(config).filter(([_, config]) => config.theme || config.color)

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          :where(#${id}) {
            ${colorConfig
              .map(([key, itemConfig]) => {
                const color = itemConfig.theme?.light || itemConfig.color
                return color ? `  --color-${key}: ${color};` : null
              })
              .join("\n")}
          }
          .dark :where(#${id}) {
            ${colorConfig
              .map(([key, itemConfig]) => {
                const color = itemConfig.theme?.dark || itemConfig.color
                return color ? `  --color-${key}: ${color};` : null
              })
              .join("\n")}
          }
        `,
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      active?: boolean
      payload?: Array<any>
      label?: string
      labelFormatter?: (label: any, payload: any[]) => React.ReactNode
      formatter?: (value: any, name: string, item: any, index: number, payload: any) => React.ReactNode
      indicator?: "line" | "dot" | "dashed"
      hideLabel?: boolean
      hideIndicator?: boolean
      labelClassName?: string
      wrapperClassName?: string
      color?: string
    }
>(
  (
    {
      active,
      payload,
      label,
      labelFormatter,
      formatter,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      labelClassName,
      wrapperClassName,
      color,
      className,
      ...props
    },
    ref
  ) => {
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${label || item.dataKey || item.name || "value"}`
      const itemConfig = item.payload?.config?.[item.dataKey] || {}
      const value =
        !labelFormatter && typeof label === "string"
          ? formatName(itemConfig?.label || label, key)
          : label

      return labelFormatter ? (
        labelFormatter(value, payload)
      ) : (
        <div className={cn("font-medium", labelClassName)}>{value}</div>
      )
    }, [label, payload, hideLabel, labelFormatter, labelClassName])

    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          wrapperClassName
        )}
        {...props}
      >
        {tooltipLabel}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${label || item.name || item.dataKey || "value"}`
            const itemConfig = item.payload?.config?.[item.dataKey] || {}
            const indicatorColor = color || item.payload?.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter ? (
                  formatter(item.value, key, item, index, payload)
                ) : (
                  <>
                    {indicator !== "none" && (
                      <div
                        className={cn(
                          "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                          {
                            "h-2.5 w-2.5": indicator === "dot",
                            "w-1 flex-1": indicator === "line",
                            "w-0 border-l-2 border-dashed bg-transparent": indicator === "dashed",
                            "my-0.5": indicator !== "dot",
                          }
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )}
                    <div className={cn("flex flex-1 justify-between leading-none", indicator === "dot" ? "items-center" : "items-start")}>
                      <div className="grid gap-1.5">
                        <span className="text-muted-foreground">
                          {formatName(itemConfig?.label || key, key)}
                        </span>
                        {indicator !== "dot" && (
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {item.value}
                          </span>
                        )}
                      </div>
                      {indicator === "dot" && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = item.payload?.config?.[item.dataKey] || {}

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {!hideIcon && (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              <span className="text-muted-foreground">
                {formatName(itemConfig?.label || key, key)}
              </span>
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegendContent"

export {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  )
>

export * from "recharts"