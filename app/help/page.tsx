export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-muted-foreground text-lg">
            Find answers to common questions and get support for using PumpWeb
          </p>
        </div>

        <div className="grid gap-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">How do I create a portfolio&#63;</h3>
                <p className="text-muted-foreground">
                  Simply fill out the form with your token details including name, ticker, contract address, 
                  and social links. Choose a template and preview your portfolio before publishing.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">What templates are available&#63;</h3>
                <p className="text-muted-foreground">
                  We offer three templates: Modern (side-by-side layout), Classic (centered vertical), 
                  and Minimal (clean white design). Each template is fully responsive.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Customization</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Can I upload custom images&#63;</h3>
                <p className="text-muted-foreground">
                  Yes, you can upload a logo and banner image to personalize your portfolio. 
                  Images should be in common formats like PNG, JPG, or SVG.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">How do I add social links&#63;</h3>
                <p className="text-muted-foreground">
                  Add your Twitter, Telegram, and website URLs in the form. These will appear 
                  as clickable buttons on your portfolio page.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Support</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Need more help&#63;</h3>
                <p className="text-muted-foreground">
                  If you can&#039;t find the answer you&#039;re looking for, please contact our support team. 
                  We&#039;re here to help you create the perfect portfolio for your project.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
