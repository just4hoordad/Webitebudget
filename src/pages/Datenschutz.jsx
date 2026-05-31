export default function Datenschutz() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <h1 className="font-heading text-3xl font-bold text-foreground">Datenschutzerklärung</h1>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">1. Verantwortlicher</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Verantwortlich für die Verarbeitung personenbezogener Daten auf dieser Website ist:<br />
          <strong className="text-foreground">Hourdad Alisedaghat</strong><br />
          E-Mail: <a href="mailto:Hoordad.sedaghat@gmail.com" className="text-primary underline">Hoordad.sedaghat@gmail.com</a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">2. Erhebung und Verarbeitung von Daten</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          BudgetBite kann ohne Registrierung oder Konto genutzt werden. Beim Besuch der Website werden keine
          personenbezogenen Daten aktiv erhoben. Wenn Sie freiwillig ein Konto erstellen oder Mahlzeitenpläne
          speichern, werden Ihre E-Mail-Adresse und die gespeicherten Pläne in unserer Datenbank abgelegt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">3. Zweck der Datenverarbeitung</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Die erhobenen Daten werden ausschließlich genutzt, um den Dienst bereitzustellen – insbesondere um
          gespeicherte Mahlzeitenpläne Ihrem Konto zuzuordnen und Ihnen wieder zugänglich zu machen.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">4. Weitergabe an Dritte</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ihre Daten werden nicht an Dritte verkauft oder zu Werbezwecken weitergegeben. Zur Bereitstellung
          des Dienstes werden KI-Dienste (z. B. zur Generierung von Einkaufslisten und Mahlzeitenplänen)
          genutzt. Dabei werden keine personenbezogenen Daten übermittelt – nur Ihre Präferenzangaben wie
          Budget, Diät und Kalorienanzahl.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">5. Cookies und lokale Speicherung</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Die App verwendet den lokalen Speicher (localStorage) des Browsers, um Ihre Spracheinstellung zu
          speichern. Es werden keine Tracking-Cookies oder Analyse-Dienste von Drittanbietern eingesetzt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">6. Ihre Rechte</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der
          Verarbeitung Ihrer personenbezogenen Daten gemäß DSGVO. Wenden Sie sich dazu an:
          <a href="mailto:hello@budgetbite.app" className="text-primary underline ml-1">hello@budgetbite.app</a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">7. Kontakt</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bei Fragen zum Datenschutz können Sie sich jederzeit an den Verantwortlichen wenden:{" "}
          <strong className="text-foreground">Hourdad Alisedaghat</strong>,{" "}
          <a href="mailto:Hoordad.sedaghat@gmail.com" className="text-primary underline">Hoordad.sedaghat@gmail.com</a>
        </p>
      </section>

      <p className="text-xs text-muted-foreground pt-4 border-t border-border">Stand: Mai 2026</p>
    </div>
  );
}