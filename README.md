# Graph Shop

**Try it in your browser: [https://brendan-newlon.github.io/graph-shop/](https://brendan-newlon.github.io/graph-shop/)**

Graph Shop shows the model elements your Stardog databases already hold: classes, relationships,
attributes, rules, and the mapping blocks that fill them with data. You can browse them, see how they
fit together and where their data comes from, and assemble a cart of parts for a new use case. Then
you can download the result or check it out into a new database.

It is a single web page with nothing to install. It talks only to the Stardog servers you connect it to.

## Sample data first

The page opens with **sample models and data that are entirely invented**, so you can look around
before connecting anything. A note under the header says so. To work with your own models, choose
**Connections** and sign in to your Stardog server; the databases you read replace the samples. Hide or
show the samples at any time from the **☰** menu (**Hide samples** / **Show samples**).

## Two ways to run it

- **Hosted:** open the link above.
- **Your own copy:** download [`graph-shop.html`](graph-shop.html) and open it in Chrome or Edge. Use
  this when you would rather not depend on a hosted page, or when your server is reached over plain
  `http`, which browsers usually block from an `https` page.

Either way the page talks to Stardog straight from your browser, so the server must allow
cross-origin requests from where the page is opened: `https://brendan-newlon.github.io` for the hosted page, or the
origin `null` for a copy opened from a file. Ask your Stardog administrator if sign-in reports that the
server could not be reached.

## Connect

1. Choose **Connections**, then **+ Add a connection**, and enter your server's address (for example
   `https://your-server:5820`), your username and password. You can also import a connection file.
2. Sign in. The page lists the server's databases; nothing else is read yet.
3. Tick the databases to explore and choose **Read**.

For each database you tick, the page reads its reasoning schemas and the graphs they cover, the mapping
blocks of its virtual graphs (from the catalog database where it holds them, and directly from each
virtual graph otherwise), and any deployment records an earlier checkout left. Requests are sent one at
a time, and reading never changes anything on the server. The account needs read access to the chosen
databases and the catalog database, and permission to list virtual graphs and read their mappings.

## What you see

- **Tabs** under the search box: Databases and Models; Classes, Relationships, Attributes and Rules;
  then Data sources, Tables, Virtual graphs and Mapping blocks. The search box narrows whichever tab you
  are on.
- **Mapping diagram:** source tables and the columns they read on the left, the model on the right,
  and a line from each column to what it fills. Right-click anything on the canvas and choose
  **Show mappings** to open it.
- **Your model** (bottom panel) draws what is in your cart, with nearby elements faded, and the mapping
  blocks that could fill your cart as faded "+ table" pills.
- **Your cart → Mapping blocks** shows the data your cart will get, statement by statement.
- **Gaps and overlaps** (☰ menu) lists things worth tidying.

## Saving, sharing and privacy

- Your cart, server addresses, usernames and chosen databases are kept in your browser so you can pick
  up where you left off. **Passwords and tokens are never saved**; they stay in the open page's memory.
- The download menu saves the model (`.ttl`), mapping blocks (`.sms`), rules (`.srs`), a Stardog
  Designer project (`.stardogdesigner`), or the whole project (`.json`).
- The page loads no scripts, fonts or images from anywhere else, and sends nothing anywhere except to
  the servers you connect.

## Checkout (optional)

Checkout is a rehearsal unless you choose a server: it shows every request it would send and produces
a guide to the assembled graph. Choosing a signed-in server and ticking the confirmation box deploys
it, by default into a new database just for this use case, and reads back what it wrote.

## Tests

The page's own checks run in Node with no network and no writes:

```
node tests/selftest.mjs
node tests/selftest.mjs --self-test
```

The first runs every check; the second confirms each check still catches a deliberately broken
version of the code. Open `graph-shop.html?selftest=1` to run the same checks plus the in-page ones
in a browser.

## License

Apache License 2.0; see [LICENSE](LICENSE) and [NOTICE](NOTICE). Copyright the Graph Shop authors.
