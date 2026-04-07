import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Calendar, Leaf } from "lucide-react";

export default function SavedMealPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const mealPlans = await base44.entities.MealPlan.list();
      setPlans(mealPlans);
    } catch (error) {
      console.error("Error loading plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id) => {
    if (!confirm("Delete this meal plan?")) return;
    try {
      await base44.entities.MealPlan.delete(id);
      setPlans(plans.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold">Saved Meal Plans</h1>
          <p className="text-sm text-muted-foreground">View and manage your meal plans</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : plans.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
          <p className="text-muted-foreground">No saved meal plans yet</p>
          <Link to="/">
            <Button>Create Your First Plan</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-foreground">{plan.name}</h3>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Leaf className="h-4 w-4" />
                      {plan.diet}
                    </span>
                    <span>€{plan.budget?.toFixed(2)}/month</span>
                    <span>{plan.calories} kcal/day</span>
                    <span>{plan.people} person(s)</span>
                  </div>
                  {plan.stores && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Stores:</strong> {plan.stores}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(plan.created_date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deletePlan(plan.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-2"
                  title="Delete plan"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {plan.plan?.days && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded p-3 max-h-24 overflow-y-auto">
                  <p className="font-medium mb-1">Week preview:</p>
                  {plan.plan.days.slice(0, 2).map((day, idx) => (
                    <p key={idx}><strong>{day.day}:</strong> {day.breakfast} • {day.lunch} • {day.dinner}</p>
                  ))}
                  {plan.plan.days.length > 2 && <p>... and more</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}