import { Route, Switch } from 'wouter';
import { SiteLayout } from '@/components/site-layout';
import HomePage from '@/pages/home';
import CoursesPage from '@/pages/cursos';
import RoomsPage from '@/pages/salas';
import EventsPage from '@/pages/eventos';
import ContactsPage from '@/pages/contactos';
import AboutPage from '@/pages/sobre-nos';
import NotFound from '@/pages/not-found';

function App() {
  return (
    <SiteLayout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/cursos" component={CoursesPage} />
        <Route path="/salas" component={RoomsPage} />
        <Route path="/eventos" component={EventsPage} />
        <Route path="/contactos" component={ContactsPage} />
        <Route path="/sobre-nos" component={AboutPage} />
        <Route component={NotFound} />
      </Switch>
    </SiteLayout>
  );
}

export default App;
