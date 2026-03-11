# UI Architect Examples

Comprehensive examples demonstrating the UI Architect skill across various frontend development scenarios.

## Table of Contents

1. [Stat Card Component](#example-1-stat-card-component)
2. [Multi-Step Form Wizard](#example-2-multi-step-form-wizard)
3. [Responsive Dashboard Layout](#example-3-responsive-dashboard-layout)
4. [Data Table with Filters](#example-4-data-table-with-filters)
5. [Settings Page](#example-5-settings-page)
6. [Modal Dialog Component](#example-6-modal-dialog-component)
7. [Responsive Navigation](#example-7-responsive-navigation)

---

## Example 1: Stat Card Component

**User Request:** "Create a stat card component for my dashboard that shows a metric, label, trend indicator, and icon"

### Step-by-Step Process

**1. Explore existing components**

First, check what shadcn/ui components are available:

```bash
# Look for existing card component
ls src/components/ui/card.tsx

# Check for icons being used
grep -r "lucide-react" src/components/
```

**2. Create the component**

```tsx
// src/components/dashboard/stat-card.tsx
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  trend?: "up" | "down" | "neutral"
  className?: string
}

export function StatCard({
  title,
  value,
  change,
  changeLabel = "from last month",
  icon,
  trend = "neutral",
  className,
}: StatCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                <TrendIcon
                  className={cn(
                    "h-4 w-4",
                    trend === "up" && "text-green-600 dark:text-green-400",
                    trend === "down" && "text-red-600 dark:text-red-400",
                    trend === "neutral" && "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "font-medium",
                    trend === "up" && "text-green-600 dark:text-green-400",
                    trend === "down" && "text-red-600 dark:text-red-400"
                  )}
                >
                  {change > 0 ? "+" : ""}{change}%
                </span>
                <span className="text-muted-foreground">{changeLabel}</span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-muted p-3">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**3. Usage example**

```tsx
import { Users, DollarSign, ShoppingCart } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"

export function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Users"
        value="2,453"
        change={12}
        icon={<Users className="h-6 w-6 text-muted-foreground" />}
        trend="up"
      />
      <StatCard
        title="Revenue"
        value="$45,231"
        change={-4}
        icon={<DollarSign className="h-6 w-6 text-muted-foreground" />}
        trend="down"
      />
      <StatCard
        title="Orders"
        value="573"
        change={0}
        icon={<ShoppingCart className="h-6 w-6 text-muted-foreground" />}
        trend="neutral"
      />
    </div>
  )
}
```

---

## Example 2: Multi-Step Form Wizard

**User Request:** "Build a user onboarding wizard with 3 steps: profile, preferences, and review"

### Step-by-Step Process

**1. Design the data structure**

```typescript
// src/types/onboarding.ts
export interface OnboardingData {
  // Step 1: Profile
  name: string
  email: string
  avatar?: string

  // Step 2: Preferences
  interests: string[]
  notificationPreference: "all" | "important" | "none"
  theme: "light" | "dark" | "system"

  // Step 3: Review (no additional data)
}
```

**2. Create the wizard component**

```tsx
// src/components/onboarding/onboarding-wizard.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { OnboardingData } from "@/types/onboarding"

const onboardingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  notificationPreference: z.enum(["all", "important", "none"]),
  theme: z.enum(["light", "dark", "system"]),
})

type FormData = z.infer<typeof onboardingSchema>

const STEPS = [
  { id: 1, title: "Profile", description: "Tell us about yourself" },
  { id: 2, title: "Preferences", description: "Customize your experience" },
  { id: 3, title: "Review", description: "Review your information" },
]

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<Partial<OnboardingData>>({})

  const form = useForm<FormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      interests: [],
      notificationPreference: "all",
      theme: "system",
    },
  })

  const progress = (currentStep / STEPS.length) * 100

  const handleNext = async () => {
    const isValid = await form.trigger(
      currentStep === 1 ? ["name", "email"] : ["interests", "notificationPreference", "theme"]
    )

    if (isValid) {
      setData({ ...data, ...form.getValues() })
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    // Submit to API
    console.log("Submitting:", data)
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome! Let's get you set up</CardTitle>
          <CardDescription>Complete these steps to personalize your experience</CardDescription>
          <Progress value={progress} className="mt-4" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            {STEPS.map((step) => (
              <span
                key={step.id}
                className={step.id === currentStep ? "text-foreground font-medium" : ""}
              >
                {step.title}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && <ProfileStep form={form} />}
          {currentStep === 2 && <PreferencesStep form={form} />}
          {currentStep === 3 && <ReviewStep data={data} />}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            {currentStep < STEPS.length ? (
              <Button onClick={handleNext}>
                {currentStep === STEPS.length ? "Complete" : "Next"}
              </Button>
            ) : (
              <Button onClick={handleSubmit}>Complete Setup</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Step components would be defined here...
```

---

## Example 3: Responsive Dashboard Layout

**User Request:** "Create a dashboard with collapsible sidebar and responsive main content area"

```tsx
// src/components/layout/dashboard-layout.tsx
"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  header: React.ReactNode
}

export function DashboardLayout({ children, sidebar, header }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-card transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <span className="text-lg font-semibold">Logo</span>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Sidebar content */}
          <nav className="flex-1 overflow-y-auto p-4">
            {sidebar}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          {header}
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## Example 4: Data Table with Filters

**User Request:** "Create a data table with search, column filters, and pagination"

```tsx
// src/components/data-table/data-table.tsx
"use client"

import { useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter..."
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Example 5: Settings Page

**User Request:** "Create a settings page with tabs for different categories"

```tsx
// src/app/settings/page.tsx
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Bell, Lock, Monitor } from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Monitor className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" defaultValue="Software developer" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive email updates</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional tabs... */}
      </Tabs>
    </div>
  )
}
```

---

## Example 6: Modal Dialog Component

```tsx
// src/components/dialogs/confirm-dialog.tsx
"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface ConfirmDialogProps {
  title: string
  description: string
  onConfirm: () => void
  trigger?: React.ReactNode
  variant?: "default" | "destructive"
}

export function ConfirmDialog({
  title,
  description,
  onConfirm,
  trigger,
  variant = "default",
}: ConfirmDialogProps) {
  if (variant === "destructive") {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          {trigger}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Example 7: Responsive Navigation

```tsx
// src/components/navigation/site-nav.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="hidden font-bold sm:inline-block">Brand</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === item.href ? "text-foreground" : "text-foreground/60"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden ml-auto">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-foreground/80",
                    pathname === item.href ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button size="sm">Get Started</Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
```

---

## Summary

These examples demonstrate:

1. **Component composition** using shadcn/ui primitives
2. **Proper TypeScript typing** for all components
3. **Responsive design** with Tailwind CSS
4. **Accessibility considerations** (ARIA, keyboard navigation)
5. **State management** patterns
6. **Form validation** with react-hook-form and zod
7. **Data table** with TanStack Table
8. **Layout patterns** for dashboards and multi-tenant apps

Each component is:
- Fully typed with TypeScript
- Responsive (mobile-first approach)
- Accessible (proper ARIA, semantic HTML)
- Dark mode compatible (using Tailwind dark: prefix)
- Composable (uses shadcn/ui as base)
