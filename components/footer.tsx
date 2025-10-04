export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start">
          <div className="mb-6 md:mb-0 md:max-w-md">
            <h3 className="font-semibold text-lg mb-4">DexPage</h3>
            <p className="text-muted-foreground text-sm">
              We believe token page creation should be as easy and affordable as creating a token on pump.fun. 
              Everyone should be able to create a token page with no hassle. That is our mission.
            </p>
          </div>
          
          <div className="flex flex-col">
            <h4 className="font-medium mb-4">Support</h4>
            <div className="flex space-x-8">
              <a href="/faq" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                FAQ
              </a>
              <a href="/about" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                About
              </a>
              <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 PumpWeb. All rights reserved.
            </p>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors mt-4 md:mt-0">
              <span className="sr-only">Discord</span>
              Discord
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
        