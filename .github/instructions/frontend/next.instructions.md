---
applyTo: "**/*.ts,**/*.tsx"
---

# Next.js 15.5.10 + React 19 Instructions

## Overview

This project uses **Next.js 15.5.10** with **React 19** and the **App Router**. These instructions outline the architecture patterns, best practices, and conventions specific to this modern stack.

## Core Principles

### 1. App Router Architecture

- **Default to Server Components**: All components in the `app/` directory are Server Components by default unless explicitly marked with `"use client"`
- **Streaming & Suspense**: Leverage React Suspense for progressive rendering and optimal loading states
- **Nested Layouts**: Use `layout.tsx` files for shared UI that persists across route changes
- **Route Groups**: Organize routes with `(groupName)` folders for logical grouping without affecting URL structure

### 2. Server vs Client Components

#### Server Components (Default)

Use Server Components when:

- Fetching data directly from APIs or databases
- Accessing backend resources (environment variables, file system)
- Rendering static content
- Keeping large dependencies on the server

```tsx
// app/posts/page.tsx
// Server Component (default - no "use client" directive)

async function getPosts() {
  const res = await fetch("https://api.example.com/posts", {
    cache: "no-store", // Dynamic data
  });
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div>
      <h1>Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

#### Client Components

Use Client Components when you need:

- Interactive event handlers (`onClick`, `onChange`, etc.)
- React hooks (`useState`, `useEffect`, `useContext`, etc.)
- Browser-only APIs (localStorage, window, etc.)
- Custom hooks or third-party libraries requiring client-side execution

```tsx
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

#### Composition Pattern

Keep Client Components small and nest them within Server Components:

```tsx
// app/dashboard/page.tsx (Server Component)
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { InteractiveChart } from "@/components/dashboard/interactive-chart";

async function getStats() {
  const res = await fetch("https://api.example.com/stats");
  return res.json();
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Server Component */}
      <DashboardStats data={stats} />
      {/* Client Component for interactivity */}
      <InteractiveChart initialData={stats} />
    </div>
  );
}
```

## Data Fetching Patterns

### Server-Side Data Fetching

Next.js 15 extends the native `fetch` API with caching and revalidation options:

#### Static Data (Cached by default)

```tsx
export default async function Page() {
  // Cached until manually invalidated (like getStaticProps)
  const data = await fetch("https://api.example.com/data", {
    cache: "force-cache", // This is the default
  });

  return <div>{/* render data */}</div>;
}
```

#### Dynamic Data (No caching)

```tsx
export default async function Page() {
  // Fetched on every request (like getServerSideProps)
  const data = await fetch("https://api.example.com/data", {
    cache: "no-store",
  });

  return <div>{/* render data */}</div>;
}
```

#### Revalidated Data (Time-based)

```tsx
export default async function Page() {
  // Cached and revalidated every 60 seconds (like ISR)
  const data = await fetch("https://api.example.com/data", {
    next: { revalidate: 60 },
  });

  return <div>{/* render data */}</div>;
}
```

#### Tag-based Revalidation

```tsx
import { revalidateTag } from "next/cache";

// Fetch with cache tag
async function getPosts() {
  const res = await fetch("https://api.example.com/posts", {
    next: { tags: ["posts"] },
  });
  return res.json();
}

// Revalidate when needed (e.g., in a Server Action)
async function createPost(formData: FormData) {
  "use server";

  // Create post logic...

  // Revalidate the posts cache
  revalidateTag("posts");
}
```

### Parallel Data Fetching

Fetch data in parallel to avoid sequential waterfalls:

```tsx
export default async function Page() {
  // Initiate all fetches in parallel
  const userPromise = fetch("https://api.example.com/user");
  const postsPromise = fetch("https://api.example.com/posts");
  const commentsPromise = fetch("https://api.example.com/comments");

  // Wait for all to complete
  const [user, posts, comments] = await Promise.all([
    userPromise.then((r) => r.json()),
    postsPromise.then((r) => r.json()),
    commentsPromise.then((r) => r.json()),
  ]);

  return <div>{/* render data */}</div>;
}
```

### Streaming with Suspense

Stream data progressively for improved perceived performance:

```tsx
import { Suspense } from "react";

async function Posts() {
  const posts = await fetch("https://api.example.com/posts");
  const data = await posts.json();

  return (
    <ul>
      {data.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

export default function Page() {
  return (
    <div>
      <h1>Blog</h1>
      {/* Static content renders immediately */}
      <p>Welcome to our blog</p>

      {/* Posts stream when ready */}
      <Suspense fallback={<div>Loading posts...</div>}>
        <Posts />
      </Suspense>
    </div>
  );
}
```

### Passing Promises to Client Components

Start fetches in Server Components and pass promises to Client Components:

```tsx
// app/dashboard/page.tsx (Server Component)
import { Suspense } from "react";
import { StatsChart } from "@/components/stats-chart";

async function getStats() {
  const res = await fetch("https://api.example.com/stats");
  return res.json();
}

export default function Dashboard() {
  // Start fetch but don't await
  const statsPromise = getStats();

  return (
    <Suspense fallback={<p>Loading chart...</p>}>
      <StatsChart dataPromise={statsPromise} />
    </Suspense>
  );
}

// components/stats-chart.tsx (Client Component)
("use client");

import { use } from "react";

type Stats = { revenue: number; orders: number };

export function StatsChart({ dataPromise }: { dataPromise: Promise<Stats> }) {
  // Use the `use` hook to unwrap the promise
  const stats = use(dataPromise);

  return <div>Revenue: ${stats.revenue}</div>;
}
```

## React 19 Features

### Actions

React 19 introduces **Actions** - functions that handle async transitions automatically with built-in pending states, error handling, and optimistic updates.

#### Basic Form Action

```tsx
"use client";

import { useActionState } from "react";

async function updateName(previousState: any, formData: FormData) {
  const name = formData.get("name");

  // Validate and update
  const error = await api.updateName(name);
  if (error) return error;

  return null;
}

export function NameForm() {
  const [error, submitAction, isPending] = useActionState(updateName, null);

  return (
    <form action={submitAction}>
      <input type="text" name="name" />
      <button type="submit" disabled={isPending}>
        {isPending ? "Updating..." : "Update"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

### useActionState Hook

Manages form submission state with automatic pending tracking:

```tsx
"use client";

import { useActionState } from "react";

async function submitForm(prevState: any, formData: FormData) {
  // Async logic
  const result = await saveData(formData);
  return result;
}

export function MyForm() {
  const [state, formAction, isPending] = useActionState(submitForm, null);

  return (
    <form action={formAction}>
      <input name="field" />
      <button disabled={isPending}>Submit</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
```

### useOptimistic Hook

Show immediate UI feedback while async operations complete:

```tsx
"use client";

import { useState, useOptimistic, startTransition } from "react";

export function LikeButton({
  postId,
  initialLikes,
}: {
  postId: string;
  initialLikes: number;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [optimisticLikes, setOptimisticLikes] = useOptimistic(likes);

  async function handleLike() {
    startTransition(() => {
      // Show optimistic update immediately
      setOptimisticLikes(optimisticLikes + 1);
    });

    // Actual API call
    const newLikes = await api.likePost(postId);
    setLikes(newLikes);
  }

  return <button onClick={handleLike}>❤️ {optimisticLikes}</button>;
}
```

### Combining useActionState + useOptimistic

```tsx
"use client";

import { useActionState, useOptimistic } from "react";

async function updateCart(prevCount: number, formData: FormData) {
  const type = formData.get("type");

  if (type === "ADD") {
    return await addToCart(prevCount);
  } else {
    return await removeFromCart(prevCount);
  }
}

export function Checkout() {
  const [count, dispatchAction, isPending] = useActionState(updateCart, 0);
  const [optimisticCount, setOptimisticCount] = useOptimistic(count);

  async function formAction(formData: FormData) {
    const type = formData.get("type");

    // Update optimistically
    if (type === "ADD") {
      setOptimisticCount((c) => c + 1);
    } else {
      setOptimisticCount((c) => Math.max(0, c - 1));
    }

    return dispatchAction(formData);
  }

  return (
    <form action={formAction}>
      <span>Quantity: {optimisticCount}</span>
      {isPending && <span>🌀</span>}
      <button type="submit" name="type" value="ADD">
        +
      </button>
      <button type="submit" name="type" value="REMOVE">
        -
      </button>
    </form>
  );
}
```

### use Hook

The `use` hook unwraps promises and context in Client Components:

```tsx
"use client";

import { use } from "react";

export function DataDisplay({ dataPromise }: { dataPromise: Promise<Data> }) {
  // Unwrap the promise
  const data = use(dataPromise);

  return <div>{data.value}</div>;
}
```

## Server Actions

Server Actions are async functions that execute on the server and can be called from Client Components.

### Inline Server Action

```tsx
export default function Page() {
  async function createUser(formData: FormData) {
    "use server";

    const name = formData.get("name");
    const email = formData.get("email");

    // Server-side logic
    await db.user.create({ name, email });
  }

  return (
    <form action={createUser}>
      <input name="name" />
      <input name="email" />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Separate Server Action File

```tsx
// actions/userActions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  await db.user.create({ name, email });

  // Revalidate the users page
  revalidatePath("/users");
}

// app/users/new/page.tsx
import { createUser } from "@/actions/userActions";

export default function NewUserPage() {
  return (
    <form action={createUser}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit">Create User</button>
    </form>
  );
}
```

### Calling Server Actions from Client Components

```tsx
"use client";

import { createUser } from "@/actions/userActions";

export function UserForm() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createUser(formData);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Routing & Navigation

### File-based Routing

```
app/
├── page.tsx              # / route
├── about/
│   └── page.tsx          # /about route
├── blog/
│   ├── page.tsx          # /blog route
│   └── [slug]/
│       └── page.tsx      # /blog/[slug] dynamic route
└── dashboard/
    ├── layout.tsx        # Shared layout for /dashboard/*
    ├── page.tsx          # /dashboard route
    └── settings/
        └── page.tsx      # /dashboard/settings route
```

### Dynamic Routes

```tsx
// app/blog/[slug]/page.tsx
type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BlogPost({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const post = await getPost(slug);

  return <article>{post.content}</article>;
}

// Generate static params at build time
export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
```

### Route Groups

Use parentheses for organization without affecting URLs:

```
app/
├── (marketing)/
│   ├── about/page.tsx    # /about
│   └── contact/page.tsx  # /contact
└── (shop)/
    ├── products/page.tsx # /products
    └── cart/page.tsx     # /cart
```

### Parallel Routes

Use `@folder` naming for parallel rendering:

```
app/
├── @sidebar/
│   └── page.tsx
├── @main/
│   └── page.tsx
└── layout.tsx

// layout.tsx
export default function Layout({ sidebar, main }: {
  sidebar: React.ReactNode
  main: React.ReactNode
}) {
  return (
    <div>
      <aside>{sidebar}</aside>
      <main>{main}</main>
    </div>
  )
}
```

### Navigation

```tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav>
      {/* Declarative navigation with Link */}
      <Link href="/about">About</Link>

      {/* Programmatic navigation */}
      <button onClick={() => router.push("/dashboard")}>Go to Dashboard</button>

      {/* Active link styling */}
      <Link href="/blog" className={pathname === "/blog" ? "active" : ""}>
        Blog
      </Link>
    </nav>
  );
}
```

## Layouts & Templates

### Root Layout (Required)

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Nested Layouts

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav>{/* Dashboard navigation */}</nav>
      <main>{children}</main>
    </div>
  );
}
```

### Templates

Templates create new instances on navigation (unlike layouts which persist):

```tsx
// app/template.tsx
export default function Template({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

## Metadata & SEO

### Static Metadata

```tsx
// app/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My App",
  description: "Welcome to my app",
  openGraph: {
    title: "My App",
    description: "Welcome to my app",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <div>Home</div>;
}
```

### Dynamic Metadata

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  return <article>{post.content}</article>;
}
```

## Loading & Error States

### Loading UI

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading dashboard...</div>;
}

// Automatically wraps page.tsx in Suspense boundary
```

### Error Handling

```tsx
// app/dashboard/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Not Found

```tsx
// app/blog/[slug]/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Post Not Found</h2>
      <p>Could not find the requested post.</p>
    </div>
  );
}

// Trigger from page
import { notFound } from "next/navigation";

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return <article>{post.content}</article>;
}
```

## Environment Variables

### Client-side Variables

Must be prefixed with `NEXT_PUBLIC_`:

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
```

```tsx
// Accessible in both Server and Client Components
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### Server-only Variables

```bash
# .env.local
DATABASE_URL=postgresql://...
API_SECRET=secret123
```

```tsx
// Only accessible in Server Components and Server Actions
const dbUrl = process.env.DATABASE_URL;
```

## Performance Optimization

### Image Optimization

```tsx
import Image from "next/image";

export function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero image"
      width={1200}
      height={600}
      priority // Load immediately (above the fold)
      placeholder="blur"
      blurDataURL="data:image/..." // Or import image for auto blur
    />
  );
}
```

### Font Optimization

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### Script Optimization

```tsx
import Script from "next/script";

export default function Page() {
  return (
    <>
      <Script
        src="https://example.com/script.js"
        strategy="lazyOnload" // or "beforeInteractive" | "afterInteractive"
      />
      <div>Content</div>
    </>
  );
}
```

### Dynamic Imports

```tsx
import dynamic from "next/dynamic";

// Load component only on client side
const HeavyComponent = dynamic(() => import("@/components/HeavyComponent"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export default function Page() {
  return (
    <div>
      <HeavyComponent />
    </div>
  );
}
```

## Middleware

```tsx
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check authentication
  const token = request.cookies.get("token");

  if (!token && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
```

## API Routes (Route Handlers)

```tsx
// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  const posts = await db.post.findMany();

  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const post = await db.post.create({
    data: body,
  });

  return NextResponse.json(post, { status: 201 });
}

// Dynamic routes: app/api/posts/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = await db.post.findUnique({ where: { id } });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}
```

## Best Practices Summary

1. **Default to Server Components**: Use Client Components only when necessary for interactivity
2. **Stream with Suspense**: Progressively load content for better UX
3. **Leverage Actions**: Use React 19 Actions for forms and async operations
4. **Cache Strategically**: Use appropriate caching strategies for different data types
5. **Parallel Fetching**: Avoid request waterfalls by fetching data in parallel
6. **Optimize Images & Fonts**: Use Next.js built-in optimizations
7. **Type Safety**: Use TypeScript for all components and functions
8. **Error Boundaries**: Implement proper error handling at route levels
9. **Loading States**: Provide loading UI for async operations
10. **Metadata**: Add proper SEO metadata for all pages

## Common Patterns

### Data Fetching in Server Component

```tsx
async function getData() {
  const res = await fetch("https://api.example.com/data", {
    next: { revalidate: 3600 }, // Revalidate every hour
  });

  if (!res.ok) throw new Error("Failed to fetch data");

  return res.json();
}

export default async function Page() {
  const data = await getData();
  return <div>{data.title}</div>;
}
```

### Form with Action + Optimistic Update

```tsx
"use client";

import { useActionState, useOptimistic } from "react";

export function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState(initialTodos);
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo],
  );

  async function addTodo(formData: FormData) {
    const title = formData.get("title") as string;
    const tempTodo = { id: crypto.randomUUID(), title, completed: false };

    addOptimisticTodo(tempTodo);

    const newTodo = await createTodo(title);
    setTodos([...todos, newTodo]);
  }

  return (
    <div>
      <ul>
        {optimisticTodos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
      <form action={addTodo}>
        <input name="title" required />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
```

### Protected Route Pattern

```tsx
// app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <header>Welcome, {user.name}</header>
      {children}
    </div>
  );
}
```

## Migration from Pages Router

If migrating from Pages Router to App Router:

1. Move pages from `pages/` to `app/` directory
2. Replace `getStaticProps` → async Server Components with `fetch({ cache: 'force-cache' })`
3. Replace `getServerSideProps` → async Server Components with `fetch({ cache: 'no-store' })`
4. Replace `getStaticPaths` → `generateStaticParams()`
5. Replace `_app.tsx` → `app/layout.tsx`
6. Replace `_document.tsx` → `app/layout.tsx` (with html/body tags)
7. Use `'use client'` for components that need interactivity
8. Move API routes from `pages/api/` to `app/api/` (with new Route Handler syntax)

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Release Notes](https://react.dev/blog/2024/12/05/react-19)
- [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
