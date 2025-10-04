export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">About DexPage</h1>
          <p className="text-muted-foreground text-lg">
            Empowering crypto projects with beautiful, professional portfolio pages
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              DexPage was created to help cryptocurrency projects and tokens establish a professional
              online presence. We believe that every project, regardless of size, deserves a beautiful
              and functional portfolio page that showcases their vision and connects them with their community.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What We Offer</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Easy Portfolio Creation</h3>
                <p className="text-muted-foreground">
                  Create stunning portfolio pages in minutes with our intuitive form-based interface.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Professional Templates</h3>
                <p className="text-muted-foreground">
                  Choose from carefully designed templates that look great on all devices.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Instant Publishing</h3>
                <p className="text-muted-foreground">
                  Your portfolio goes live immediately with a shareable URL for your community.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium">No Technical Skills Required</h3>
                <p className="text-muted-foreground">
                  No coding or design experience needed. Just fill out the form and publish.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Why Choose DexPage&#63;</h2>
            <p className="text-muted-foreground leading-relaxed">
              In the fast-moving world of cryptocurrency, first impressions matter. A professional
              portfolio page builds trust with your community and provides a central hub for all
              your project information. DexPage makes it simple to create that crucial first impression
              without the complexity of traditional web development.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
