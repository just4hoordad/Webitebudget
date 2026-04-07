import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function MealPlan() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <h2 className="font-heading text-2xl font-bold">Meal Plan</h2>
      <p className="text-muted-foreground">Coming soon...</p>
      <Link to="/">
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}