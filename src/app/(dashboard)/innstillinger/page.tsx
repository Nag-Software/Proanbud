import { PageHeader } from "@/components/shared/PageHeader";
import { UserSettings, BusinessSettings, SubscriptionSettings } from "@/components/settings";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <PageHeader title="Innstillinger" />
            
            <div className="space-y-8">
                {/* User Settings */}
                <UserSettings />
                
                {/* Business & Branding Settings */}
                <BusinessSettings />
                
                {/* Subscription Settings */}
                <SubscriptionSettings />
            </div>
        </div>
    );
}