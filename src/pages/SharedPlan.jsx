import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import PlanGroceryResult from "@/components/planbuilder/PlanGroceryResult";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2, Leaf } from "lucide-react";
import { toast } from "sonner";

export default function SharedPlan() {
  const { token } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await base44.functions.invoke("getSharedPlan", { token });
        if (!alive) return;
        if (res.data?.error || !res.data?.plan) {
          setNotFound(true);
        } else {
          setPlan(res.data);
        }
      } catch {
        if (alive) setNotFound(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const handleCopy = async () => {
    const authed = await base44.auth.isAuthenticated().catch(() => false);
    if (!authed) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      return;
    }
    setCopying(true);
    try {
      await base44.entities.MealPlan.create({
        name: `${plan.name || "Shared plan"} ${t("copySuffix") || "(copy)"}`,
        diet: plan.diet,
        people: plan.people,
        stores: plan.stores,
        macros: plan.macros,
        plan: plan.plan,
        groceryList: plan.groceryList,
        prep: plan.prep,
      });
      setCopied(true);
      toast.success(t("copiedToLibrary") || "Copied to your library");
    } catch {
      toast.error(t("copyFailed") || "Couldn't copy plan");
    } finally {
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Leaf className="h-10 w-10 text-muted-foreground" />
        <p className="font-heading text-lg font-semibold">
          {t("sharedPlanNotFound") || "This shared plan is no longer available"}
        </p>
        <Button onClick={() => navigate("/")}>{t("goHome") || "Go home"}</Button>
      </div>
    );
  }

  const days = Array.isArray(plan.plan) ? plan.plan.length : 7;

  const footer = (
    <div className="space-y-2">
      <Button onClick={handleCopy} disabled={copying || copied} className="w-full h-12">
        {copied ? (
          <Check className="h-4 w-4" />
        ) : copying ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {copied
          ? t("copied") || "Copied"
          : t("copyToLibrary") || "Copy to my library"}
      </Button>
      {copied && (
        <Button variant="outline" className="w-full" onClick={() => navigate("/saved-plans")}>
          {t("openInLibrary") || "Open in my library"}
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <PlanGroceryResult
          grocery={plan.groceryList}
          prep={plan.prep}
          days={days}
          people={plan.people || 1}
          calories={plan.calories}
          onReset={() => {}}
          readOnly
          footer={footer}
        />
      </div>
    </div>
  );
}