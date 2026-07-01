import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpenIcon,
  BoxesIcon,
  Building2Icon,
  ChevronRightIcon,
  CopyIcon,
  FileIcon,
  FileTextIcon,
  HomeIcon,
  ImagePlusIcon,
  Loader2Icon,
  LogOutIcon,
  RefreshCwIcon,
  SaveIcon,
  ShieldIcon,
  UploadIcon,
  UserPlusIcon,
  UsersIcon
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type Role = "ADMIN" | "EDITOR" | "VIEWER";
type UserStatus = "ACTIVE" | "DISABLED";

type MediaAsset = {
  id?: string;
  kind?: "IMAGE" | "DOCUMENT";
  filename?: string;
  publicUrl?: string;
  url?: string;
  originalName?: string;
  alt?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt?: string;
};

type CaseMetric = {
  label: string;
  value: string;
  description: string;
};

type TimelineStep = {
  title: string;
  timeLabel: string;
};

type CaseStudy = {
  id?: string;
  slug: string;
  title: string;
  badge: string;
  image?: MediaAsset | null;
  imageUrl?: string;
  summaryParagraphs: string[];
  metrics: CaseMetric[];
  timelineSteps: TimelineStep[];
  sortOrder: number;
  status: Status;
};

type Whitepaper = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  preview?: MediaAsset | null;
  document?: MediaAsset | null;
  previewUrl?: string;
  documentUrl?: string;
  onlineUrl?: string | null;
  downloadUrl?: string | null;
  sortOrder: number;
  status: Status;
};

type User = {
  id?: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
};

type RawContent = {
  caseSection?: {
    title?: string;
  };
  whitepaperSection?: {
    title?: string;
    description?: string;
    cover?: MediaAsset | null;
  };
  cases: CaseStudy[];
  whitepapers: Whitepaper[];
};

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

type TabKey = "cases" | "whitepapers" | "media" | "users";

const isStaticPreview =
  typeof window !== "undefined" &&
  (window.location.hostname.endsWith("github.io") || new URLSearchParams(window.location.search).get("preview") === "1");

const staticPreviewUser: SessionUser = {
  id: "preview-admin",
  email: "admin@pmagic.local",
  name: "预览管理员",
  role: "ADMIN"
};

const staticPreviewUsers: User[] = [
  { id: "user-admin", email: "admin@pmagic.local", name: "管理员", role: "ADMIN", status: "ACTIVE" },
  { id: "user-editor", email: "editor@pmagic.local", name: "内容编辑", role: "EDITOR", status: "ACTIVE" },
  { id: "user-viewer", email: "viewer@pmagic.local", name: "客户查看者", role: "VIEWER", status: "ACTIVE" }
];

const staticPreviewMedia: MediaAsset[] = [
  {
    id: "media-case",
    kind: "IMAGE",
    filename: "case-city.webp",
    originalName: "案例城市配图",
    publicUrl: "../assets/images/case-city.webp",
    mimeType: "image/webp",
    sizeBytes: 184000
  },
  {
    id: "media-whitepaper",
    kind: "IMAGE",
    filename: "whitepaper-books-cover.webp",
    originalName: "白皮书封面",
    publicUrl: "../assets/images/whitepaper-books-cover.webp",
    mimeType: "image/webp",
    sizeBytes: 126000
  }
];

const staticPreviewRaw: RawContent = {
  caseSection: { title: "从真实项目中验证的智能闭环" },
  whitepaperSection: {
    title: "浏览建工 AI 白皮书",
    description: "系统了解多 Agent 架构、材料闭环、成本预测与企业微信协同的落地方法。",
    cover: staticPreviewMedia[1]
  },
  cases: [
    {
      id: "case-huzhou",
      slug: "huzhou-zhidong",
      title: "湖州织东控规单元项目",
      badge: "真实案例",
      imageUrl: "../assets/images/case-city.webp",
      summaryParagraphs: [
        "项目总规划面积约 15 万㎡，正处于主供货的施工高峰期，对钢筋等主材的供应要求很高。",
        "盈泰 AI 建工管理矩阵 OS 通过多 Agent 协同，快速完成采购全流程任务，保障现场施工不断档。"
      ],
      metrics: [
        { label: "全流程", value: "26 小时", description: "完成采购全链路" },
        { label: "提前", value: "62 天", description: "比原计划提前" },
        { label: "成本下降", value: "12.6%", description: "采购成本降低" },
        { label: "间接损失减少", value: "529.7 万", description: "停工损失降低" }
      ],
      timelineSteps: [
        { title: "需求识别", timeLabel: "0h" },
        { title: "供应商匹配", timeLabel: "2h" },
        { title: "在线询比价", timeLabel: "6h" },
        { title: "合同签署", timeLabel: "10h" },
        { title: "过磅追踪", timeLabel: "24h" },
        { title: "保供闭环", timeLabel: "提前 62 天" }
      ],
      sortOrder: 1,
      status: "PUBLISHED"
    }
  ],
  whitepapers: [
    {
      id: "wp-agent",
      slug: "agent-architecture",
      title: "多 Agent 架构指南",
      summary: "了解多 Agent 架构的设计原则与落地路径。",
      previewUrl: "../assets/images/whitepaper-agent-orchestrator.webp",
      onlineUrl: "#",
      downloadUrl: "#",
      sortOrder: 1,
      status: "PUBLISHED"
    },
    {
      id: "wp-procurement",
      slug: "procurement-weighing-loop",
      title: "智慧采购与过磅闭环",
      summary: "从采购到过磅的全流程协同，实现数据闭环与风险切控。",
      previewUrl: "../assets/images/whitepaper-procurement-loop.webp",
      onlineUrl: "#",
      downloadUrl: "#",
      sortOrder: 2,
      status: "PUBLISHED"
    },
    {
      id: "wp-cost",
      slug: "cost-forecast",
      title: "项目成本预测实践",
      summary: "基于数据与 AI 的成本预测模型助项目降本增效。",
      previewUrl: "../assets/images/whitepaper-cost-forecast.webp",
      onlineUrl: "#",
      downloadUrl: "#",
      sortOrder: 3,
      status: "DRAFT"
    }
  ]
};

const statusLabels: Record<Status, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  ARCHIVED: "已归档"
};

const statusVariant: Record<Status, "default" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "outline"
};

const roleLabels: Record<Role, string> = {
  ADMIN: "管理员",
  EDITOR: "编辑",
  VIEWER: "查看者"
};

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function staticPreviewApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, 160));

  if (path === "/api/auth/me" || path === "/api/auth/login") {
    return { user: staticPreviewUser } as T;
  }

  if (path === "/api/auth/logout") {
    return { ok: true } as T;
  }

  if (path === "/api/admin/raw-content" || path === "/api/admin/content") {
    return cloneData(staticPreviewRaw) as T;
  }

  if (path === "/api/admin/users") {
    return cloneData(staticPreviewUsers) as T;
  }

  if (path === "/api/admin/media" && (!options.method || options.method === "GET")) {
    return cloneData(staticPreviewMedia) as T;
  }

  if (path === "/api/admin/media" && options.method === "POST") {
    const file = options.body instanceof FormData ? options.body.get("file") : null;
    const filename = file instanceof File ? file.name : "preview-upload.png";
    return {
      id: `preview-${Date.now()}`,
      kind: filename.toLowerCase().endsWith(".pdf") ? "DOCUMENT" : "IMAGE",
      filename,
      originalName: filename,
      publicUrl: `../assets/images/${filename}`,
      mimeType: file instanceof File ? file.type : "image/png",
      sizeBytes: file instanceof File ? file.size : 0
    } as T;
  }

  if (options.method && ["POST", "PATCH", "DELETE"].includes(options.method)) {
    return { ok: true } as T;
  }

  throw new Error("静态预览暂不支持该接口");
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (isStaticPreview) {
    return staticPreviewApi<T>(path, options);
  }

  const headers =
    options.body instanceof FormData
      ? options.headers
      : options.body
        ? {
            "Content-Type": "application/json",
            ...(options.headers || {})
          }
        : options.headers;

  const response = await fetch(path, {
    credentials: "same-origin",
    headers,
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }

  return response.json();
}

async function uploadMedia(file: File) {
  const form = new FormData();
  form.append("file", file);
  return api<MediaAsset>("/api/admin/media", { method: "POST", body: form });
}

function mediaUrl(asset?: MediaAsset | null) {
  return asset?.publicUrl || asset?.url || "";
}

function formatBytes(value?: number) {
  if (!value) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parsePipedRows<T extends string>(value: string, keys: T[]) {
  return splitLines(value).map((line) => {
    const parts = line.split("|").map((part) => part.trim());
    return Object.fromEntries(keys.map((key, index) => [key, parts[index] || ""])) as Record<T, string>;
  });
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function createCaseDraft(): CaseStudy {
  return {
    slug: "",
    title: "新案例",
    badge: "真实案例",
    imageUrl: "",
    summaryParagraphs: ["请输入案例背景。"],
    metrics: [{ label: "指标", value: "0", description: "指标说明" }],
    timelineSteps: [{ title: "节点", timeLabel: "0h" }],
    sortOrder: 0,
    status: "DRAFT"
  };
}

function createWhitepaperDraft(): Whitepaper {
  return {
    slug: "",
    title: "新白皮书",
    summary: "请输入白皮书简介。",
    previewUrl: "",
    documentUrl: "",
    onlineUrl: "",
    downloadUrl: "",
    sortOrder: 0,
    status: "DRAFT"
  };
}

function createUserDraft(): User & { password?: string } {
  return {
    email: "",
    name: "新用户",
    role: "EDITOR",
    status: "ACTIVE",
    password: ""
  };
}

function App() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [raw, setRaw] = useState<RawContent | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("cases");
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async (user: SessionUser | null) => {
    const content = await api<RawContent>("/api/admin/raw-content");
    setRaw(content);

    if (user?.role === "ADMIN") {
      const adminUsers = await api<User[]>("/api/admin/users");
      setUsers(adminUsers);
    } else {
      setUsers([]);
    }
  }, []);

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ user: SessionUser | null }>("/api/auth/me");
      if (!data.user) {
        setCurrentUser(null);
        return;
      }

      setCurrentUser(data.user);
      await loadDashboard(data.user);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [loadDashboard]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (loading) return <LoadingScreen />;

  if (!currentUser) {
    return (
      <TooltipProvider>
        <LoginScreen onLogin={checkSession} />
        <Toaster position="top-center" richColors />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          activeTab={activeTab}
          currentUser={currentUser}
          raw={raw}
          onTabChange={setActiveTab}
          onLogout={async () => {
            try {
              await api("/api/auth/logout", { method: "POST" });
              toast.success("已退出登录");
            } catch {
              toast.warning("本地登录状态已清除");
            } finally {
              setCurrentUser(null);
              setRaw(null);
              setUsers([]);
              setActiveTab("cases");
            }
          }}
        />
        <SidebarInset>
          <AppTopbar
            currentUser={currentUser}
            onRefresh={async () => {
              await loadDashboard(currentUser);
              toast.success("内容已刷新");
            }}
          />
          <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            {isStaticPreview && (
              <Alert>
                <ShieldIcon data-icon="inline-start" />
                <AlertTitle>静态预览模式</AlertTitle>
                <AlertDescription>
                  当前后台运行在 GitHub Pages，只用于客户查看界面和配置流程。保存、上传、删除会模拟成功，真实数据写入需要部署 `server/` 后端服务。
                </AlertDescription>
              </Alert>
            )}
            {!raw ? (
              <DashboardSkeleton />
            ) : (
              <AdminDashboard
                activeTab={activeTab}
                currentUser={currentUser}
                raw={raw}
                users={users}
                onReload={async () => {
                  await loadDashboard(currentUser);
                }}
                onTabChange={setActiveTab}
              />
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster position="top-center" richColors />
    </TooltipProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2Icon className="animate-spin" data-icon="inline-start" />
        正在加载后台
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => Promise<void> }) {
  const [email, setEmail] = useState("admin@pmagic.local");
  const [password, setPassword] = useState("ChangeMe123!");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      await onLogin();
      toast.success("登录成功");
    } catch {
      toast.error("登录失败，请检查账号和密码");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[1.15fr_0.85fr]">
      <section className="hidden min-h-svh flex-col justify-between border-r bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2Icon data-icon="inline-start" />
          </div>
          <div>
            <div className="text-sm font-medium">PMagic AI</div>
            <div className="text-xs text-muted-foreground">建工内容管理中心</div>
          </div>
        </div>
        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <ShieldIcon data-icon="inline-start" />
            Admin Console
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">内容、素材、权限统一管理</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
            保持官网白皮书和项目案例与后台数据一致，支持发布状态、排序、素材与用户权限维护。
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>内容模块</CardDescription>
              <CardTitle>2</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>默认白皮书</CardDescription>
              <CardTitle>3</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>权限角色</CardDescription>
              <CardTitle>3</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>
      <section className="flex min-h-svh items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>登录内容后台</CardTitle>
            <CardDescription>使用管理员账号进入 PMagic 管理中心。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">邮箱</FieldLabel>
                  <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">密码</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </Field>
              </FieldGroup>
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
                登录
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function AppSidebar({
  activeTab,
  currentUser,
  raw,
  onTabChange,
  onLogout
}: {
  activeTab: TabKey;
  currentUser: SessionUser;
  raw: RawContent | null;
  onTabChange: (tab: TabKey) => void;
  onLogout: () => Promise<void>;
}) {
  const navItems = [
    { key: "cases" as const, label: "案例管理", icon: Building2Icon, count: raw?.cases.length },
    { key: "whitepapers" as const, label: "白皮书管理", icon: FileTextIcon, count: raw?.whitepapers.length },
    { key: "media" as const, label: "素材上传", icon: ImagePlusIcon },
    ...(currentUser.role === "ADMIN" ? [{ key: "users" as const, label: "用户权限", icon: UsersIcon }] : [])
  ];

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BoxesIcon data-icon="inline-start" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">PMagic Admin</div>
            <div className="truncate text-xs text-muted-foreground">建工内容管理中心</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>工作台</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton isActive={activeTab === item.key} onClick={() => onTabChange(item.key)}>
                    <item.icon data-icon="inline-start" />
                    <span>{item.label}</span>
                    {typeof item.count === "number" && <Badge variant="secondary">{item.count}</Badge>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>前台入口</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href={isStaticPreview ? "../" : "/"} target="_blank" rel="noreferrer">
                    <HomeIcon data-icon="inline-start" />
                    <span>打开官网</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              <Avatar size="sm">
                <AvatarFallback>{currentUser.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{currentUser.name}</span>
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>{currentUser.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOutIcon data-icon="inline-start" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function AppTopbar({
  currentUser,
  onRefresh
}: {
  currentUser: SessionUser;
  onRefresh: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">白皮书与案例后台</div>
        <div className="truncate text-xs text-muted-foreground">{roleLabels[currentUser.role]} · {currentUser.email}</div>
      </div>
      <Button
        variant="outline"
        disabled={refreshing}
        onClick={async () => {
          setRefreshing(true);
          try {
            await onRefresh();
          } finally {
            setRefreshing(false);
          }
        }}
      >
        <RefreshCwIcon className={refreshing ? "animate-spin" : ""} data-icon="inline-start" />
        刷新
      </Button>
    </header>
  );
}

function AdminDashboard({
  activeTab,
  currentUser,
  raw,
  users,
  onReload,
  onTabChange
}: {
  activeTab: TabKey;
  currentUser: SessionUser;
  raw: RawContent;
  users: User[];
  onReload: () => Promise<void>;
  onTabChange: (tab: TabKey) => void;
}) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as TabKey)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">内容运营台</h1>
          <p className="text-sm text-muted-foreground">维护官网案例、白皮书、素材和后台用户。</p>
        </div>
        <TabsList className="w-full justify-start overflow-x-auto md:w-auto">
          <TabsTrigger value="cases">案例</TabsTrigger>
          <TabsTrigger value="whitepapers">白皮书</TabsTrigger>
          <TabsTrigger value="media">素材</TabsTrigger>
          {currentUser.role === "ADMIN" && <TabsTrigger value="users">用户</TabsTrigger>}
        </TabsList>
      </div>

      <TabsContent value="cases" className="m-0">
        <CaseManager cases={raw.cases} onReload={onReload} />
      </TabsContent>

      <TabsContent value="whitepapers" className="m-0">
        <WhitepaperManager whitepapers={raw.whitepapers} onReload={onReload} />
      </TabsContent>

      <TabsContent value="media" className="m-0">
        <MediaManager />
      </TabsContent>

      {currentUser.role === "ADMIN" && (
        <TabsContent value="users" className="m-0">
          <UserManager users={users} onReload={onReload} />
        </TabsContent>
      )}
    </Tabs>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardDescription>{title}</CardDescription>
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon data-icon="inline-start" />
          </div>
        </div>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{detail}</CardContent>
    </Card>
  );
}

function SectionsCard({ raw, onReload }: { raw: RawContent; onReload: () => Promise<void> }) {
  const [caseTitle, setCaseTitle] = useState(raw.caseSection?.title || "");
  const [whitepaperTitle, setWhitepaperTitle] = useState(raw.whitepaperSection?.title || "");
  const [whitepaperDescription, setWhitepaperDescription] = useState(raw.whitepaperSection?.description || "");
  const [whitepaperCoverUrl, setWhitepaperCoverUrl] = useState(mediaUrl(raw.whitepaperSection?.cover));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCaseTitle(raw.caseSection?.title || "");
    setWhitepaperTitle(raw.whitepaperSection?.title || "");
    setWhitepaperDescription(raw.whitepaperSection?.description || "");
    setWhitepaperCoverUrl(mediaUrl(raw.whitepaperSection?.cover));
  }, [raw]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>模块配置</CardTitle>
        <CardDescription>官网案例区和白皮书区的模块标题。</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>案例模块标题</FieldLabel>
              <Input value={caseTitle} onChange={(event) => setCaseTitle(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel>白皮书模块标题</FieldLabel>
              <Input value={whitepaperTitle} onChange={(event) => setWhitepaperTitle(event.target.value)} />
            </Field>
          </div>
          <Field>
            <FieldLabel>白皮书模块简介</FieldLabel>
            <Textarea rows={3} value={whitepaperDescription} onChange={(event) => setWhitepaperDescription(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>白皮书封面 URL</FieldLabel>
            <MediaUrlField
              label="白皮书封面"
              value={whitepaperCoverUrl}
              onChange={setWhitepaperCoverUrl}
              accept="image/*"
              preview="image"
            />
            <FieldDescription>可使用现有 `/assets/images/...` 或上传后的 `/uploads/...`。</FieldDescription>
          </Field>
          <div className="flex justify-end">
            <Button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await api("/api/admin/sections", {
                    method: "PATCH",
                    body: JSON.stringify({ caseTitle, whitepaperTitle, whitepaperDescription, whitepaperCoverUrl })
                  });
                  toast.success("模块配置已保存");
                  await onReload();
                } catch (error) {
                  toast.error("保存失败");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              保存配置
            </Button>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function CaseManager({ cases, onReload }: { cases: CaseStudy[]; onReload: () => Promise<void> }) {
  const [items, setItems] = useState<CaseStudy[]>(cases);

  useEffect(() => {
    setItems(cases);
  }, [cases]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">案例管理</h2>
          <p className="text-sm text-muted-foreground">维护项目案例、指标和时间线。</p>
        </div>
        <Button onClick={() => setItems([createCaseDraft(), ...items])}>
          <Building2Icon data-icon="inline-start" />
          新增案例
        </Button>
      </div>
      <div className="grid gap-4">
        {items.map((item, index) => (
          <CaseEditor key={item.id || `draft-${index}`} item={item} onReload={onReload} />
        ))}
      </div>
    </div>
  );
}

function CaseEditor({ item, onReload }: { item: CaseStudy; onReload: () => Promise<void> }) {
  const [title, setTitle] = useState(item.title);
  const [slug, setSlug] = useState(item.slug);
  const [badge, setBadge] = useState(item.badge);
  const [imageUrl, setImageUrl] = useState(item.imageUrl || mediaUrl(item.image));
  const [summaryParagraphs, setSummaryParagraphs] = useState(item.summaryParagraphs.join("\n"));
  const [metrics, setMetrics] = useState(item.metrics.map((metric) => `${metric.label} | ${metric.value} | ${metric.description}`).join("\n"));
  const [timelineSteps, setTimelineSteps] = useState(item.timelineSteps.map((step) => `${step.title} | ${step.timeLabel}`).join("\n"));
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder ?? 0));
  const [status, setStatus] = useState<Status>(item.status);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const payload = {
        title,
        slug: slug || toSlug(title),
        badge,
        imageUrl,
        summaryParagraphs: splitLines(summaryParagraphs),
        metrics: parsePipedRows(metrics, ["label", "value", "description"]) as CaseMetric[],
        timelineSteps: parsePipedRows(timelineSteps, ["title", "timeLabel"]) as TimelineStep[],
        sortOrder: Number(sortOrder || 0),
        status
      };
      await api(item.id ? `/api/admin/cases/${item.id}` : "/api/admin/cases", {
        method: item.id ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });
      toast.success("案例已保存");
      await onReload();
    } catch {
      toast.error("案例保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            {imageUrl ? (
              <img className="size-14 rounded-lg border object-cover" src={imageUrl} alt="" />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                <Building2Icon data-icon="inline-start" />
              </div>
            )}
            <div>
              <CardTitle>{title || "未命名案例"}</CardTitle>
              <CardDescription>{slug || "保存后生成 Slug"}</CardDescription>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={status} />
                <Badge variant="secondary">{badge}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {item.id && (
              <Button
                variant="destructive"
                onClick={async () => {
                  await api(`/api/admin/cases/${item.id}`, { method: "DELETE" });
                  toast.success("案例已归档");
                  await onReload();
                }}
              >
                归档
              </Button>
            )}
            <Button disabled={saving} onClick={save}>
              {saving ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              保存
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field>
              <FieldLabel>标题</FieldLabel>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Slug</FieldLabel>
              <Input value={slug} onChange={(event) => setSlug(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel>标签</FieldLabel>
              <Input value={badge} onChange={(event) => setBadge(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel>状态</FieldLabel>
              <StatusSelect value={status} onChange={setStatus} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_140px]">
            <Field>
              <FieldLabel>封面</FieldLabel>
              <MediaUrlField label="案例封面" value={imageUrl} onChange={setImageUrl} accept="image/*" preview="image" />
            </Field>
            <Field>
              <FieldLabel>排序</FieldLabel>
              <Input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
            </Field>
          </div>
          <Field>
            <FieldLabel>正文段落</FieldLabel>
            <Textarea rows={4} value={summaryParagraphs} onChange={(event) => setSummaryParagraphs(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>指标</FieldLabel>
            <Textarea rows={4} value={metrics} onChange={(event) => setMetrics(event.target.value)} />
            <FieldDescription>每行格式：标签 | 数值 | 说明</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>时间线</FieldLabel>
            <Textarea rows={4} value={timelineSteps} onChange={(event) => setTimelineSteps(event.target.value)} />
            <FieldDescription>每行格式：标题 | 时间</FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function WhitepaperManager({ whitepapers, onReload }: { whitepapers: Whitepaper[]; onReload: () => Promise<void> }) {
  const [items, setItems] = useState<Whitepaper[]>(whitepapers);

  useEffect(() => {
    setItems(whitepapers);
  }, [whitepapers]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">白皮书管理</h2>
          <p className="text-sm text-muted-foreground">维护卡片、预览图、浏览链接和下载地址。</p>
        </div>
        <Button onClick={() => setItems([createWhitepaperDraft(), ...items])}>
          <FileTextIcon data-icon="inline-start" />
          新增白皮书
        </Button>
      </div>
      <div className="grid gap-4">
        {items.map((item, index) => (
          <WhitepaperEditor key={item.id || `draft-${index}`} item={item} onReload={onReload} />
        ))}
      </div>
    </div>
  );
}

function WhitepaperEditor({ item, onReload }: { item: Whitepaper; onReload: () => Promise<void> }) {
  const [title, setTitle] = useState(item.title);
  const [slug, setSlug] = useState(item.slug);
  const [summary, setSummary] = useState(item.summary);
  const [previewUrl, setPreviewUrl] = useState(item.previewUrl || mediaUrl(item.preview));
  const [documentUrl, setDocumentUrl] = useState(item.documentUrl || mediaUrl(item.document));
  const [onlineUrl, setOnlineUrl] = useState(item.onlineUrl || "");
  const [downloadUrl, setDownloadUrl] = useState(item.downloadUrl || "");
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder ?? 0));
  const [status, setStatus] = useState<Status>(item.status);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api(item.id ? `/api/admin/whitepapers/${item.id}` : "/api/admin/whitepapers", {
        method: item.id ? "PATCH" : "POST",
        body: JSON.stringify({
          title,
          slug: slug || toSlug(title),
          summary,
          previewUrl,
          documentUrl,
          onlineUrl,
          downloadUrl,
          sortOrder: Number(sortOrder || 0),
          status
        })
      });
      toast.success("白皮书已保存");
      await onReload();
    } catch {
      toast.error("白皮书保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            {previewUrl ? (
              <img className="size-14 rounded-lg border object-cover" src={previewUrl} alt="" />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                <BookOpenIcon data-icon="inline-start" />
              </div>
            )}
            <div>
              <CardTitle>{title || "未命名白皮书"}</CardTitle>
              <CardDescription>{summary}</CardDescription>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={status} />
                <Badge variant="outline">排序 {sortOrder || 0}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {item.id && (
              <Button
                variant="destructive"
                onClick={async () => {
                  await api(`/api/admin/whitepapers/${item.id}`, { method: "DELETE" });
                  toast.success("白皮书已归档");
                  await onReload();
                }}
              >
                归档
              </Button>
            )}
            <Button disabled={saving} onClick={save}>
              {saving ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
              保存
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field>
              <FieldLabel>标题</FieldLabel>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Slug</FieldLabel>
              <Input value={slug} onChange={(event) => setSlug(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel>状态</FieldLabel>
              <StatusSelect value={status} onChange={setStatus} />
            </Field>
            <Field>
              <FieldLabel>排序</FieldLabel>
              <Input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
            </Field>
          </div>
          <Field>
            <FieldLabel>简介</FieldLabel>
            <Textarea rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>预览图</FieldLabel>
              <MediaUrlField label="白皮书预览图" value={previewUrl} onChange={setPreviewUrl} accept="image/*" preview="image" />
            </Field>
            <Field>
              <FieldLabel>文件</FieldLabel>
              <MediaUrlField
                label="白皮书文件"
                value={documentUrl}
                onChange={setDocumentUrl}
                accept="application/pdf,.pdf"
                preview="document"
                onUploaded={(url) => {
                  if (!downloadUrl) setDownloadUrl(url);
                }}
              />
            </Field>
            <Field>
              <FieldLabel>在线浏览 URL</FieldLabel>
              <Input value={onlineUrl} onChange={(event) => setOnlineUrl(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel>下载 URL</FieldLabel>
              <Input value={downloadUrl} onChange={(event) => setDownloadUrl(event.target.value)} />
            </Field>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function MediaUrlField({
  label,
  value,
  onChange,
  accept,
  preview,
  onUploaded
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  accept?: string;
  preview?: "image" | "document";
  onUploaded?: (url: string, asset: MediaAsset) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const asset = await uploadMedia(file);
      const publicUrl = asset.publicUrl || "";
      onChange(publicUrl);
      onUploaded?.(publicUrl, asset);
      toast.success(`${label}已上传`);
    } catch {
      toast.error(`${label}上传失败`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-col gap-2 lg:flex-row">
        <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="/uploads/..." />
        <input ref={inputRef} className="hidden" type="file" accept={accept} onChange={(event) => handleFile(event.target.files?.[0])} />
        <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()} className="lg:w-28">
          {uploading ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <UploadIcon data-icon="inline-start" />}
          上传
        </Button>
      </div>
      {value && (
        <div className="flex items-center gap-3 rounded-md border bg-muted/35 p-2">
          {preview === "image" ? (
            <img className="size-12 rounded border object-cover" src={value} alt="" />
          ) : (
            <div className="flex size-12 items-center justify-center rounded border bg-background text-muted-foreground">
              <FileIcon data-icon="inline-start" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">{preview === "document" ? "文件地址已回填，可用于下载链接" : "图片将按此地址在前台展示"}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaManager() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);

  const loadAssets = useCallback(async () => {
    try {
      const data = await api<MediaAsset[]>("/api/admin/media");
      setAssets(data);
    } catch {
      toast.error("素材列表加载失败");
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>素材库</CardTitle>
          <CardDescription>这里用于集中上传和复制素材地址；在案例、白皮书表单里也可以直接上传回填。</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>选择文件</FieldLabel>
              <Input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </Field>
            <div className="flex flex-col gap-3 md:flex-row">
              <Button
                disabled={!file || uploading}
                onClick={async () => {
                  if (!file) return;
                  setUploading(true);
                  try {
                    const asset = await uploadMedia(file);
                    setUploadedUrl(asset.publicUrl || "");
                    toast.success("素材已上传");
                    await loadAssets();
                  } catch {
                    toast.error("素材上传失败");
                  } finally {
                    setUploading(false);
                  }
                }}
              >
                {uploading ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <UploadIcon data-icon="inline-start" />}
                上传素材
              </Button>
              <Input readOnly value={uploadedUrl} placeholder="上传后生成 URL" />
            </div>
            {uploadedUrl && (
              <Alert>
                <ImagePlusIcon data-icon="inline-start" />
                <AlertTitle>素材地址</AlertTitle>
                <AlertDescription>{uploadedUrl}</AlertDescription>
              </Alert>
            )}
          </FieldGroup>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>最近素材</CardTitle>
          <CardDescription>复制地址后可粘贴到任何 URL 字段。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {assets.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">暂无上传素材。</div>
            ) : (
              assets.map((asset) => (
                <div key={asset.id || asset.publicUrl} className="flex items-center gap-3 rounded-md border p-3">
                  {asset.mimeType?.startsWith("image/") ? (
                    <img className="size-12 rounded border object-cover" src={asset.publicUrl} alt="" />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded border bg-muted text-muted-foreground">
                      <FileIcon data-icon="inline-start" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{asset.originalName || asset.filename}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {asset.publicUrl} · {formatBytes(asset.sizeBytes)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(asset.publicUrl || "");
                      toast.success("素材地址已复制");
                    }}
                  >
                    <CopyIcon data-icon="inline-start" />
                    复制
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UserManager({ users, onReload }: { users: User[]; onReload: () => Promise<void> }) {
  const [items, setItems] = useState<Array<User & { password?: string }>>(users);

  useEffect(() => {
    setItems(users);
  }, [users]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">用户权限</h2>
          <p className="text-sm text-muted-foreground">维护后台登录账号、角色和状态。</p>
        </div>
        <Button onClick={() => setItems([createUserDraft(), ...items])}>
          <UserPlusIcon data-icon="inline-start" />
          新增用户
        </Button>
      </div>
      <div className="grid gap-4">
        {items.map((item, index) => (
          <UserEditor key={item.id || `user-draft-${index}`} item={item} onReload={onReload} />
        ))}
      </div>
    </div>
  );
}

function UserEditor({ item, onReload }: { item: User & { password?: string }; onReload: () => Promise<void> }) {
  const [name, setName] = useState(item.name);
  const [email, setEmail] = useState(item.email);
  const [role, setRole] = useState<Role>(item.role);
  const [status, setStatus] = useState<UserStatus>(item.status);
  const [password, setPassword] = useState(item.password || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const payload: Record<string, string> = { name, email, role, status };
      if (password) payload.password = password;
      if (!item.id && !password) payload.password = "ChangeMe123!";
      await api(item.id ? `/api/admin/users/${item.id}` : "/api/admin/users", {
        method: item.id ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });
      toast.success("用户已保存");
      await onReload();
    } catch {
      toast.error("用户保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr_150px_150px_190px_auto] xl:items-end">
          <Field>
            <FieldLabel>姓名</FieldLabel>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>邮箱</FieldLabel>
            <Input disabled={Boolean(item.id)} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>角色</FieldLabel>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ADMIN">管理员</SelectItem>
                  <SelectItem value="EDITOR">编辑</SelectItem>
                  <SelectItem value="VIEWER">查看者</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>状态</FieldLabel>
            <Select value={status} onValueChange={(value) => setStatus(value as UserStatus)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ACTIVE">启用</SelectItem>
                  <SelectItem value="DISABLED">禁用</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>新密码</FieldLabel>
            <Input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="留空不修改" />
          </Field>
          <Button disabled={saving} onClick={save}>
            {saving ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
            保存
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusSelect({ value, onChange }: { value: Status; onChange: (value: Status) => void }) {
  return (
    <Select value={value} onValueChange={(nextValue) => onChange(nextValue as Status)}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="DRAFT">草稿</SelectItem>
          <SelectItem value="PUBLISHED">已发布</SelectItem>
          <SelectItem value="ARCHIVED">已归档</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function StatusBadge({ status }: { status: Status }) {
  return <Badge variant={statusVariant[status]}>{statusLabels[status]}</Badge>;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
