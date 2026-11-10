export { HomeScreen } from './Home';
export { ShopScreen, DealsScreen } from './Market';
export { SpendingScreen } from './Spending';
export { FamilyScreen, AlertsScreen } from './People';
export { ChatScreen } from './Chat';
export { CartScreen, CheckoutScreen, SuccessScreen } from './Basket';
export { AccountScreen } from './Account';
export { ScanScreen } from './Capture';
import { Link } from 'react-router';
import { useApp } from '../app/AppContext';
import { EmptyState } from '../components/UI';
export function NotFoundScreen() { const { t } = useApp(); return <div className="screen"><EmptyState title={t('Page not found', 'الصفحة مش موجودة')} body={t('Let’s get you back home.', 'نرجع للرئيسية.')}><Link className="primary-button" to="/">{t('Back home', 'الرئيسية')}</Link></EmptyState></div>; }
