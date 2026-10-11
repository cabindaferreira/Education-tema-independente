import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { ptPT } from '@clerk/localizations';
import { shadcn } from '@clerk/themes';
import { useQueryClient } from '@tanstack/react-query';
import {
  Redirect as WouterRedirect,
  Route,
  Router as WouterRouter,
  Switch,
  useLocation,
} from 'wouter';
import { SiteLayout } from '@/components/site-layout';
import HomePage from '@/pages/home';
import CoursesPage from '@/pages/cursos';
import RoomsPage from '@/pages/salas';
import EventsPage from '@/pages/eventos';
import ContactsPage from '@/pages/contactos';
import AboutPage from '@/pages/sobre-nos';
import { AccountPage } from '@/pages/conta';
import { SignInPage, SignUpPage } from '@/pages/auth';
import NotFound from '@/pages/not-found';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in the app environment.');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#c91f2e',
    colorForeground: '#302728',
    colorMutedForeground: '#6d7472',
    colorDanger: '#bd2633',
    colorBackground: '#fffdfa',
    colorInput: '#ffffff',
    colorInputForeground: '#302728',
    colorNeutral: '#ded5d1',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.65rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffdfa] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: '!text-[#302728]',
    headerSubtitle: '!text-[#6d7472]',
    socialButtonsBlockButtonText: '!text-[#302728]',
    formFieldLabel: '!text-[#302728]',
    footerActionLink: '!text-[#a51e2a]',
    footerActionText: '!text-[#6d7472]',
    dividerText: '!text-[#6d7472]',
    identityPreviewEditButton: '!text-[#a51e2a]',
    formFieldSuccessText: '!text-[#347b52]',
    alertText: '!text-[#302728]',
    logoBox: 'mb-2',
    logoImage: 'max-h-12',
    socialButtonsBlockButton: '!border-[#e7dcda] !bg-white hover:!bg-[#fff2f3]',
    formButtonPrimary: '!bg-[#c91f2e] hover:!bg-[#a71927] !text-white',
    formFieldInput: '!border-[#ded5d1] !bg-white !text-[#302728]',
    footerAction: '!bg-transparent',
    dividerLine: '!bg-[#e7dcda]',
    alert: '!border-[#f1d0d2]',
    otpCodeFieldInput: '!border-[#ded5d1] !bg-white !text-[#302728]',
    formFieldRow: 'mb-4',
    main: '!bg-transparent',
  },
};

function ClerkQueryCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) {
        queryClient.clear();
      }
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function PublicHome() {
  return (
    <>
      <Show when="signed-in">
        <WouterRedirect to="/conta" />
      </Show>
      <Show when="signed-out">
        <SiteLayout><HomePage /></SiteLayout>
      </Show>
    </>
  );
}

function PublicPage({ children }: { children: ReactNode }) {
  return <SiteLayout>{children}</SiteLayout>;
}

function AppRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={ptPT}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkQueryCacheInvalidator />
      <Switch>
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/conta" component={AccountPage} />
        <Route path="/" component={PublicHome} />
        <Route path="/cursos"><PublicPage><CoursesPage /></PublicPage></Route>
        <Route path="/salas"><PublicPage><RoomsPage /></PublicPage></Route>
        <Route path="/eventos"><PublicPage><EventsPage /></PublicPage></Route>
        <Route path="/contactos"><PublicPage><ContactsPage /></PublicPage></Route>
        <Route path="/sobre-nos"><PublicPage><AboutPage /></PublicPage></Route>
        <Route><PublicPage><NotFound /></PublicPage></Route>
      </Switch>
    </ClerkProvider>
  );
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}

export default App;
