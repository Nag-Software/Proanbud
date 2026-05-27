"use client"

import * as React from "react"

import { BrandMark } from "@/components/brand-mark"
import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, UsersIcon, InboxIcon, BadgePercentIcon, Building2Icon, Settings2Icon, FrameIcon, PieChartIcon, MapIcon, Bell, CalendarDays, FolderIcon, FilesIcon } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import { useUserRole } from "@/hooks/use-user-role"
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { CreateProjectDrawer } from "@/app/prosjekter/create-project-dialog"

// This is sample data.
const data = {
  user: {
    name: "laster...",
    email: "laster...",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashbord",
      url: "/",
      icon: <LayoutDashboardIcon className="size-4" />,
      isActive: true,
    },
    {
      title: "Prosjekter",
      url: "/prosjekter",
      icon: <FolderIcon className="size-4" />,
    },
    {
      title: "Kunder",
      url: "/kunder",
      icon: <UsersIcon className="size-4" />,
    },
    {
      title: "Kalender",
      url: "/kalender",
      icon: <CalendarDays className="size-4" />,
    },
    {
      title: "Meldinger",
      url: "/meldinger",
      icon: <InboxIcon className="size-4" />,
    },
    {
      title: "Dokumenter",
      url: "/dokumenter",
      icon: <FilesIcon className="size-4" />,
    },
    {
      title: "Mine priser",
      url: "/mine-priser",
      icon: <BadgePercentIcon className="size-4" />,
      items: [
        {
          title: "Prisfiler",
          url: "/mine-priser/prisfiler",
        },
        {
          title: "Lagrede jobber",
          url: "/mine-priser/lagrede-jobber",
        },
        {
          title: "Timepriser",
          url: "/mine-priser/timepriser",
        }
      ]
    },
    {
      title: "Min bedrift",
      url: "/min-bedrift",
      icon: <Building2Icon className="size-4" />,
      items: [
        {
          title: "Bedriftsprofil",
          url: "/min-bedrift/bedriftsprofil",
        },
        {
          title: "Bedriftsinnstillinger",
          url: "/min-bedrift/bedriftsinnstillinger",
        },
        {
          title: "Ansatte og roller",
          url: "/min-bedrift/ansatte-og-roller",
        },
        {
          title: "Integrasjoner",
          url: "/min-bedrift/integrasjoner",
        },
      ]
    },
    {
      title: "Innstillinger",
      url: "/innstillinger",
      icon: <Settings2Icon className="size-4" />,
      items: [
        {
          title: "Generelt",
          url: "/innstillinger/generelt",
        },
        {
          title: "Brukere",
          url: "/innstillinger/brukere",
        },
        {
          title: "Betaling",
          url: "/innstillinger/betaling",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Oppussing Storgata",
      url: "#",
      icon: (
        <FrameIcon
        />
      ),
    },
    {
      name: "Tilbygg Enebolig",
      url: "#",
      icon: (
        <PieChartIcon
        />
      ),
    },
    {
      name: "Garasje 50kvm",
      url: "#",
      icon: (
        <MapIcon
        />
      ),
    },
  ],
}


function AppSidebarHeader() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarHeader className="pb-0">
      <div className="flex items-center justify-between p-2 pb-0">
        {isCollapsed ? (
          <BrandMark iconOnly className="h-9 w-9 rounded-lg border-border/80 text-base shadow-none" />
        ) : (
          <BrandMark className="text-[1.65rem]" />
        )}
        {!isCollapsed && (
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
        )}
      </div>
      <CreateProjectDrawer
        variant="outline"
        size="sm"
        className={cn("mt-1 w-full hover:shadow-sm", isCollapsed && "h-9 w-9 p-0")}
        label={isCollapsed ? "" : "Nytt prosjekt"}
        showIcon
      />
    </SidebarHeader>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { role } = useUserRole();
  const { user } = useAuth();
  const { state } = useSidebar();
  const [activeProjects, setActiveProjects] = React.useState<any[]>([]);
  const isCollapsed = state === "collapsed";

  React.useEffect(() => {
    async function fetchProjects() {
      if (!user || role === null) return;
      
      const supabase = createClient();
      
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select("id, name")
        .in("status", ["planning", "active"])
        .order("updated_at", { ascending: false })
        .limit(5);

      if (projectsData && !error) {
        setActiveProjects(
          projectsData.map(p => ({
            name: p.name,
            url: `/prosjekter/${p.id}`,
            icon: <FrameIcon />,
          }))
        );
      }
    }

    fetchProjects();
  }, [user, role]);

  // Filter items for "Håndverker"
  const isHandverker = role === "Håndverker";
  
  const filteredNavMain = data.navMain.filter(item => {
    if (!isHandverker) return true; // Show all if not Håndverker
    
    // Håndverker skal IKKE se disse
    const hiddenForHandverker = [
      "Salg & Økonomi", 
      "Kunder", 
      "Mine priser", 
      "Min bedrift", 
      "Innstillinger"
    ];
    return !hiddenForHandverker.includes(item.title);
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <AppSidebarHeader />
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavProjects projects={activeProjects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
