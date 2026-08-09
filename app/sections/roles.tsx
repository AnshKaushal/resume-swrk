import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FullWidthDivider } from "@/components/ui/full-width-divider"
import { Container } from "@/components/container"
import { DecorIcon } from "@/components/ui/decor-icon"
import { Icon } from "@iconify/react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link"

type TileData = {
  row: number
  col: number
  icon: string
  iconColor: string
  iconName: string
}

type Role = {
  name: string
  icon: string
  color: string
}

const ROLES: Role[] = [
  { name: "Frontend", icon: "mdi:code-tags", color: "#61DAFB" },
  { name: "Backend", icon: "mdi:server", color: "#528BFF" },
  { name: "Full Stack", icon: "mdi:layers", color: "#00C853" },
  { name: "React", icon: "logos:react", color: "#61DAFB" },
  { name: "Next.js", icon: "logos:nextjs-icon", color: "#FFFFFF" },
  { name: "Node.js", icon: "logos:nodejs-icon", color: "#339933" },
  { name: "Java", icon: "logos:java", color: "#F89820" },
  { name: "Python", icon: "logos:python", color: "#3776AB" },
  { name: "Data Analyst", icon: "mdi:chart-line", color: "#FF6D00" },
  { name: "DevOps", icon: "mdi:docker", color: "#2496ED" },
  { name: "UI/UX", icon: "mdi:palette", color: "#E91E63" },
  { name: "Marketing", icon: "mdi:bullhorn", color: "#4CAF50" },
  { name: "Sales", icon: "mdi:handshake", color: "#2196F3" },
  { name: "Finance", icon: "mdi:currency-usd", color: "#4CAF50" },
  { name: "HR", icon: "mdi:account-group", color: "#9C27B0" },
]

export default function Roles() {
  return (
    <Container className="w-full">
      <section className="relative grid grid-cols-1 gap-12 border-x md:grid-cols-2 md:items-center ">
        <FullWidthDivider className="-top-px" />
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <FullWidthDivider className="-bottom-px" />

        <div className="p-4 md:p-6">
          <div className="space-y-4">
            <h2 className="font-medium text-3xl text-foreground tracking-tight sm:text-4xl">
              Optimise For <span className="text-primary">Any</span> Role
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              From Frontend to Finance, get rewrites matched to the exact role
              you&apos;re applying for.
            </p>
            <Button nativeButton={false} render={<Link href="/analyse" />}>
              Optimise My Resume
            </Button>
          </div>
        </div>

        <div className="place-items-end">
          <div className="relative size-80">
            <div
              className={cn(
                "absolute inset-0 size-full",
                "bg-[linear-gradient(to_right,theme(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,theme(--color-border)_1px,transparent_1px)]",
                "bg-size-[64px_64px]",
                "mask-[radial-gradient(ellipse_at_center,black,black,transparent)]",
              )}
            />

            {tiles.map((tile) => (
              <IntegrationCard key={`${tile.row}_${tile.col}`} {...tile} />
            ))}
          </div>
        </div>

        {/* <FullWidthDivider className="-bottom-px" /> */}
      </section>
    </Container>
  )
}

function IntegrationCard({ row, col, icon, iconColor, iconName }: TileData) {
  return (
    <div
      className={cn(
        "absolute flex size-16 items-center justify-center",
        icon ? "bg-secondary/40" : "",
      )}
      style={{
        left: col * 64,
        top: row * 64,
      }}
    >
      <Tooltip>
        <TooltipTrigger>
          {" "}
          <Icon
            icon={icon}
            className="pointer-events-none size-8 select-none"
            style={{ color: iconColor }}
          />
        </TooltipTrigger>
        <TooltipContent>{iconName}</TooltipContent>
      </Tooltip>
    </div>
  )
}

const tiles: TileData[] = [
  {
    row: 0,
    col: 0,
    icon: ROLES[0].icon,
    iconColor: ROLES[0].color,
    iconName: ROLES[0].name,
  },
  {
    row: 0,
    col: 2,
    icon: ROLES[1].icon,
    iconColor: ROLES[1].color,
    iconName: ROLES[1].name,
  },
  {
    row: 0,
    col: 4,
    icon: ROLES[12].icon,
    iconColor: ROLES[12].color,
    iconName: ROLES[12].name,
  },
  {
    row: 1,
    col: 1,
    icon: ROLES[2].icon,
    iconColor: ROLES[2].color,
    iconName: ROLES[2].name,
  },
  {
    row: 1,
    col: 3,
    icon: ROLES[3].icon,
    iconColor: ROLES[3].color,
    iconName: ROLES[3].name,
  },
  {
    row: 2,
    col: 0,
    icon: ROLES[4].icon,
    iconColor: ROLES[4].color,
    iconName: ROLES[4].name,
  },
  {
    row: 2,
    col: 2,
    icon: ROLES[9].icon,
    iconColor: ROLES[9].color,
    iconName: ROLES[9].name,
  },
  {
    row: 2,
    col: 4,
    icon: ROLES[10].icon,
    iconColor: ROLES[10].color,
    iconName: ROLES[10].name,
  },
  {
    row: 3,
    col: 1,
    icon: ROLES[5].icon,
    iconColor: ROLES[5].color,
    iconName: ROLES[5].name,
  },
  {
    row: 3,
    col: 3,
    icon: ROLES[6].icon,
    iconColor: ROLES[6].color,
    iconName: ROLES[6].name,
  },
  {
    row: 4,
    col: 0,
    icon: ROLES[7].icon,
    iconColor: ROLES[7].color,
    iconName: ROLES[7].name,
  },
  {
    row: 4,
    col: 2,
    icon: ROLES[8].icon,
    iconColor: ROLES[8].color,
    iconName: ROLES[8].name,
  },
  {
    row: 4,
    col: 4,
    icon: ROLES[11].icon,
    iconColor: ROLES[11].color,
    iconName: ROLES[11].name,
  },
]
