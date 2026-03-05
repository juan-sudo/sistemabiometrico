import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="
      grid grid-cols-1 gap-4 px-4
      sm:grid-cols-2
      lg:grid-cols-3
      xl:grid-cols-4
      lg:px-6
    ">
      {/* CARD 1 */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl font-semibold">$1,250.00</CardTitle>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <IconTrendingUp size={16} />
            +12.5%
          </Badge>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">
            Trending up this month
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>

      {/* CARD 2 */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardDescription>New Customers</CardDescription>
            <CardTitle className="text-2xl font-semibold">1,234</CardTitle>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <IconTrendingDown size={16} />
            -20%
          </Badge>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">
            Down 20% this period
            <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Acquisition needs attention
          </div>
        </CardFooter>
      </Card>

      {/* CARD 3 */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardDescription>Active Accounts</CardDescription>
            <CardTitle className="text-2xl font-semibold">45,678</CardTitle>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <IconTrendingUp size={16} />
            +12.5%
          </Badge>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">
            Strong user retention
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Engagement exceed targets
          </div>
        </CardFooter>
      </Card>

      {/* CARD 4 */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardDescription>Growth Rate</CardDescription>
            <CardTitle className="text-2xl font-semibold">4.5%</CardTitle>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <IconTrendingUp size={16} />
            +4.5%
          </Badge>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">
            Steady performance increase
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Meets growth projections
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
