param(
  [string]$BaseUrl = "https://www.neolifeporium.com",
  [string]$Root = "./"
)

$ErrorActionPreference = "Stop"
$rootPath = Resolve-Path $Root
$postsPath = Join-Path $rootPath "data/posts.json"
$posts = @((Get-Content $postsPath -Raw | ConvertFrom-Json).posts | Where-Object { -not $_.draft })

$pages = @(
  "index.html",
  "about.html",
  "portfolio.html",
  "case-study.html",
  "blog.html",
  "privacy-policy.html",
  "terms.html"
)

# sitemap.xml
$sitemapDoc = New-Object System.Xml.XmlDocument
$decl = $sitemapDoc.CreateXmlDeclaration("1.0", "UTF-8", $null)
$sitemapDoc.AppendChild($decl) | Out-Null
$urlset = $sitemapDoc.CreateElement("urlset", "http://www.sitemaps.org/schemas/sitemap/0.9")
$sitemapDoc.AppendChild($urlset) | Out-Null

function Add-SitemapUrl([System.Xml.XmlElement]$parent, [string]$locValue) {
  $doc = $parent.OwnerDocument
  $url = $doc.CreateElement("url", $parent.NamespaceURI)
  $loc = $doc.CreateElement("loc", $parent.NamespaceURI)
  $loc.InnerText = $locValue
  $url.AppendChild($loc) | Out-Null
  $parent.AppendChild($url) | Out-Null
}

$pages | ForEach-Object { Add-SitemapUrl -parent $urlset -locValue "$BaseUrl/$_" }
$posts | ForEach-Object { Add-SitemapUrl -parent $urlset -locValue "$BaseUrl/blog-post.html?slug=$($_.slug)" }
$sitemapDoc.Save((Join-Path $rootPath "sitemap.xml"))

# rss.xml
$rssDoc = New-Object System.Xml.XmlDocument
$rssDecl = $rssDoc.CreateXmlDeclaration("1.0", "UTF-8", $null)
$rssDoc.AppendChild($rssDecl) | Out-Null
$rss = $rssDoc.CreateElement("rss")
$rss.SetAttribute("version", "2.0")
$rssDoc.AppendChild($rss) | Out-Null
$channel = $rssDoc.CreateElement("channel")
$rss.AppendChild($channel) | Out-Null

function Add-Child([System.Xml.XmlElement]$parent, [string]$name, [string]$value) {
  $doc = $parent.OwnerDocument
  $node = $doc.CreateElement($name)
  $node.InnerText = $value
  $parent.AppendChild($node) | Out-Null
}

Add-Child -parent $channel -name "title" -value "Neolifeporium Insights"
Add-Child -parent $channel -name "link" -value "$BaseUrl/blog.html"
Add-Child -parent $channel -name "description" -value "Insights on e-commerce, Neolearn, and digital infrastructure in Ghana."

$posts | Sort-Object { [datetime]$_.date } -Descending | ForEach-Object {
  $item = $rssDoc.CreateElement("item")
  Add-Child -parent $item -name "title" -value $_.title
  Add-Child -parent $item -name "link" -value "$BaseUrl/blog-post.html?slug=$($_.slug)"
  Add-Child -parent $item -name "guid" -value "$BaseUrl/blog-post.html?slug=$($_.slug)"
  Add-Child -parent $item -name "description" -value $_.excerpt
  Add-Child -parent $item -name "pubDate" -value ([datetime]$_.date).ToUniversalTime().ToString("r")
  $channel.AppendChild($item) | Out-Null
}

$rssDoc.Save((Join-Path $rootPath "rss.xml"))
Write-Output "Generated sitemap.xml and rss.xml"
