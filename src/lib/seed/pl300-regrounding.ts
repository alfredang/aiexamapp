/**
 * PL-300 re-grounding: repairs the malformed/dump-sourced legacy imports.
 *
 * Three idempotent operations (safe to re-run):
 *   1. TRIM   — strip leaked "Explanation:/Reference Link:/PBIX File Link:"
 *               tails out of option bodies for salvageable (non-dump) questions
 *               across the whole catalog (AI-900 / CCNA formatting leaks).
 *   2. REMOVE — delete PL-300 questions sourced from a third-party exam dump
 *               (reference a .pbix / the ravikiran GitHub repo, or depend on
 *               screenshots the runner can't show). Detected by content, so a
 *               second run finds nothing to remove.
 *   3. INSERT — recreate curated, blueprint-aligned replacement questions
 *               grounded ONLY in Microsoft Learn, tagged `manual:pl300-regrounded`
 *               (delete-and-recreate by that tag). One replacement per removed
 *               question, in the same exam + domain, so each exam returns to its
 *               original question and teaser counts.
 *
 * No images, no dump links, first-party references only.
 */
import type { PrismaClient } from '@prisma/client';

export const REGROUND_TAG = 'manual:pl300-regrounded';

// Content signatures of the third-party PL-300 dump batch / image-dependent items.
const DUMP_RE = /ravikiran|\.pbix|refer to image|the image below|image\s*\d|practice test\s*\d/i;
// Explanation/source text leaked into an option body.
const LEAK_RE = /\s*(?:Explanation:|Reference Link:|PBIX File Link:)/i;

type Variant = 'p1' | 'p2' | 'p3' | 'p4' | 'p5';
type QType = 'SINGLE' | 'MULTI' | 'TRUE_FALSE';
type Opt = { id: string; text: string };
type SeedQ = {
  variant: Variant;
  domain: string;
  type: QType;
  isTeaser?: boolean;
  stem: string;
  options: Opt[];
  correct: string[];
  explanation: string;
  references: { url: string; label: string }[];
};

const LEARN = (path: string, label: string) => ({ url: `https://learn.microsoft.com/${path}`, label });

// ── Prepare the data (5) ──────────────────────────────────────────────────
const PREPARE: SeedQ[] = [
  {
    variant: 'p1', domain: 'Prepare the data', type: 'SINGLE',
    stem: 'In Power Query Editor, your source CSV has the real column names sitting in the first row of data, while the columns are currently named Column1, Column2, and so on. Which transformation promotes those values to be the column headers?',
    options: [
      { id: 'A', text: 'Use First Row as Headers' },
      { id: 'B', text: 'Transpose' },
      { id: 'C', text: 'Group By' },
      { id: 'D', text: 'Fill Down' }
    ],
    correct: ['A'],
    explanation: 'Use First Row as Headers (Promote Headers) takes the first row of the table and turns it into the column header row. Transpose swaps rows and columns, Group By aggregates, and Fill Down copies a value into the rows below it.',
    references: [LEARN('en-us/power-query/promote-demote-headers', 'Promote or demote column headers — Power Query')]
  },
  {
    variant: 'p1', domain: 'Prepare the data', type: 'SINGLE',
    stem: 'You connect to a SQL Server table in Power Query and add several transformation steps. To keep the query efficient, you want as many steps as possible to be translated into a single SQL statement that runs on the source. What is this capability called?',
    options: [
      { id: 'A', text: 'Query folding' },
      { id: 'B', text: 'Incremental refresh' },
      { id: 'C', text: 'Query diagnostics' },
      { id: 'D', text: 'Data profiling' }
    ],
    correct: ['A'],
    explanation: 'Query folding is the ability of Power Query to translate transformation steps into the source system\'s native query language (e.g. T-SQL) so the work happens at the source. Steps that cannot fold (such as adding an index column) break folding for subsequent steps.',
    references: [LEARN('en-us/power-query/power-query-folding', 'Overview of query folding — Power Query')]
  },
  {
    variant: 'p2', domain: 'Prepare the data', type: 'SINGLE',
    stem: 'You have two queries, Sales_2023 and Sales_2024, with identical columns. You want a single query that stacks all rows from both. Which Power Query operation should you use?',
    options: [
      { id: 'A', text: 'Append Queries' },
      { id: 'B', text: 'Merge Queries' },
      { id: 'C', text: 'Reference' },
      { id: 'D', text: 'Duplicate' }
    ],
    correct: ['A'],
    explanation: 'Append stacks the rows of queries with the same structure on top of one another (a UNION). Merge joins queries side-by-side on matching key columns (a JOIN). Reference and Duplicate create new queries but do not combine data.',
    references: [LEARN('en-us/power-query/append-queries', 'Append queries — Power Query')]
  },
  {
    variant: 'p2', domain: 'Prepare the data', type: 'SINGLE',
    stem: 'Before transforming a large table, you want to see what percentage of values in each column are valid, empty, or in error, based on a sample. Which Power Query feature shows this?',
    options: [
      { id: 'A', text: 'Column quality' },
      { id: 'B', text: 'Column profile' },
      { id: 'C', text: 'Query dependencies' },
      { id: 'D', text: 'Applied steps' }
    ],
    correct: ['A'],
    explanation: 'Column quality (on the View tab) displays the valid / error / empty percentages for each column. Column distribution shows distinct and unique counts; Column profile gives detailed statistics for a selected column. By default profiling is based on the top 1,000 rows.',
    references: [LEARN('en-us/power-query/data-profiling-tools', 'Data profiling tools — Power Query')]
  },
  {
    variant: 'p3', domain: 'Prepare the data', type: 'SINGLE',
    stem: 'A date column arrives as text formatted dd/MM/yyyy, but your Power BI Desktop locale is English (United States), so changing the type to Date produces errors. What is the correct way to convert it?',
    options: [
      { id: 'A', text: 'Use Change Type → Using Locale and choose a locale that matches dd/MM/yyyy' },
      { id: 'B', text: 'Replace all errors with the current date, then change the type to Date' },
      { id: 'C', text: 'Round the column, then change the type to Date' },
      { id: 'D', text: 'Set the column data type to Whole Number first' }
    ],
    correct: ['A'],
    explanation: 'Change Type → Using Locale lets you specify the locale used to interpret the text, so dd/MM/yyyy values parse correctly regardless of the file\'s/Desktop\'s default locale. Replacing errors with today\'s date would corrupt the data.',
    references: [LEARN('en-us/power-query/conversion-matrix', 'Data types and conversions — Power Query')]
  }
];

// ── Visualize and analyze the data (2) ────────────────────────────────────
const VISUALIZE: SeedQ[] = [
  {
    variant: 'p1', domain: 'Visualize and analyze the data', type: 'SINGLE',
    stem: 'You need to show total monthly sales across a continuous 24-month period and emphasize the trend over time. Which visual is the most appropriate default choice?',
    options: [
      { id: 'A', text: 'Line chart' },
      { id: 'B', text: 'Pie chart' },
      { id: 'C', text: 'Treemap' },
      { id: 'D', text: 'Card' }
    ],
    correct: ['A'],
    explanation: 'A line chart is designed to show trends over a continuous interval such as time. Pie charts and treemaps show part-to-whole composition at a point in time, and a card shows a single aggregated value.',
    references: [LEARN('en-us/power-bi/visuals/power-bi-visualization-line-charts', 'Line charts in Power BI')]
  },
  {
    variant: 'p3', domain: 'Visualize and analyze the data', type: 'SINGLE', isTeaser: true,
    stem: 'On a sales report you want users to right-click a specific product on the summary page and jump to a detail page that is automatically filtered to that product. Which Power BI feature provides this?',
    options: [
      { id: 'A', text: 'Drillthrough' },
      { id: 'B', text: 'Bookmarks' },
      { id: 'C', text: 'Spotlight' },
      { id: 'D', text: 'Sync slicers' }
    ],
    correct: ['A'],
    explanation: 'Drillthrough lets you build a target page that is filtered to the context (e.g. a product) the user right-clicked on another page. Bookmarks capture a view state, Spotlight emphasizes one visual, and sync slicers share a slicer\'s selection across pages.',
    references: [LEARN('en-us/power-bi/create-reports/desktop-drillthrough', 'Set up drillthrough in Power BI reports')]
  }
];

// ── Model the data (16) ───────────────────────────────────────────────────
const MODEL: SeedQ[] = [
  {
    variant: 'p2', domain: 'Model the data', type: 'SINGLE',
    stem: 'You need a calculation that returns total sales and responds to slicers, filters, and the rows/columns of any visual it is placed in, without increasing the size of the stored model. Should you create a calculated column or a measure?',
    options: [
      { id: 'A', text: 'A measure, because it is evaluated at query time in filter context and is not stored row-by-row' },
      { id: 'B', text: 'A calculated column, because it is evaluated for every row and stored in the model' },
      { id: 'C', text: 'A calculated table, because it materializes the result' },
      { id: 'D', text: 'A what-if parameter, because it generates the values automatically' }
    ],
    correct: ['A'],
    explanation: 'Measures are evaluated at query time within the visual\'s filter context and are not persisted per row, so they respond to slicers/filters and add little to model size. Calculated columns are computed row-by-row and stored, increasing model size and not reacting to filter context the same way.',
    references: [LEARN('en-us/power-bi/transform-model/desktop-calculated-columns', 'Calculated columns vs measures in Power BI')]
  },
  {
    variant: 'p4', domain: 'Model the data', type: 'SINGLE', isTeaser: true,
    stem: 'Which DAX function evaluates an expression in a modified filter context — for example, ignoring or overriding filters — and is the primary function used to change filter context inside a measure?',
    options: [
      { id: 'A', text: 'CALCULATE' },
      { id: 'B', text: 'SUMX' },
      { id: 'C', text: 'RELATED' },
      { id: 'D', text: 'CONCATENATEX' }
    ],
    correct: ['A'],
    explanation: 'CALCULATE evaluates an expression in a context modified by the filter arguments you supply (using modifiers such as ALL, KEEPFILTERS, USERELATIONSHIP). It is the cornerstone function for manipulating filter context. SUMX is an iterator, RELATED follows a relationship to a single related value.',
    references: [LEARN('en-us/dax/calculate-function-dax', 'CALCULATE function (DAX)')]
  },
  {
    variant: 'p5', domain: 'Model the data', type: 'SINGLE', isTeaser: true,
    stem: 'For a typical Power BI import model with one fact table and several lookup tables, which schema design does Microsoft recommend for best performance and usability?',
    options: [
      { id: 'A', text: 'Star schema' },
      { id: 'B', text: 'Snowflake schema with fully normalized dimensions' },
      { id: 'C', text: 'A single flat wide table' },
      { id: 'D', text: 'A many-to-many schema between all tables' }
    ],
    correct: ['A'],
    explanation: 'A star schema — a central fact table related to denormalized dimension tables — is the recommended modeling approach in Power BI. It simplifies relationships and DAX and performs well. Snowflaking adds normalization that usually hurts performance and usability.',
    references: [LEARN('en-us/power-bi/guidance/star-schema', 'Understand star schema and the importance for Power BI')]
  },
  {
    variant: 'p5', domain: 'Model the data', type: 'SINGLE', isTeaser: true,
    stem: 'You create a relationship between a Sales fact table and a Product dimension on ProductKey. Product has one row per product; Sales has many rows per product. What is the cardinality of this relationship?',
    options: [
      { id: 'A', text: 'Many-to-one (from Sales to Product)' },
      { id: 'B', text: 'One-to-one' },
      { id: 'C', text: 'Many-to-many' },
      { id: 'D', text: 'No relationship is possible' }
    ],
    correct: ['A'],
    explanation: 'The fact table side has many rows per key and the dimension side has one, so the relationship is many-to-one (equivalently one-to-many from Product to Sales). This is the standard cardinality between a fact and a dimension in a star schema.',
    references: [LEARN('en-us/power-bi/transform-model/desktop-create-and-manage-relationships', 'Create and manage relationships in Power BI Desktop')]
  },
  {
    variant: 'p5', domain: 'Model the data', type: 'SINGLE', isTeaser: true,
    stem: 'In a star schema with a one-to-many relationship from a Date dimension to a Sales fact table, which cross-filter direction is recommended so the dimension filters the fact?',
    options: [
      { id: 'A', text: 'Single (from the one-side dimension to the many-side fact)' },
      { id: 'B', text: 'Both, to be safe' },
      { id: 'C', text: 'It does not matter for performance' },
      { id: 'D', text: 'Single, from the fact to the dimension' }
    ],
    correct: ['A'],
    explanation: 'Single-direction cross-filtering from the dimension to the fact is the recommended default. Bidirectional filtering can introduce ambiguity and performance issues and should be used only when a specific requirement (e.g. certain many-to-many or slicer scenarios) demands it.',
    references: [LEARN('en-us/power-bi/guidance/relationships-bidirectional-filtering', 'Bidirectional relationship guidance — Power BI')]
  },
  {
    variant: 'p5', domain: 'Model the data', type: 'SINGLE', isTeaser: true,
    stem: 'Your model has two relationships between Sales and Date (OrderDate and ShipDate). Only one can be active. How do you write a measure that aggregates sales by ShipDate using the currently inactive relationship?',
    options: [
      { id: 'A', text: 'Wrap the calculation in CALCULATE and use USERELATIONSHIP to activate the ShipDate relationship' },
      { id: 'B', text: 'Delete the OrderDate relationship' },
      { id: 'C', text: 'Set both relationships to active' },
      { id: 'D', text: 'Use the RELATED function on ShipDate' }
    ],
    correct: ['A'],
    explanation: 'USERELATIONSHIP, used inside CALCULATE, temporarily activates an inactive relationship for that calculation — e.g. CALCULATE(SUM(Sales[Amount]), USERELATIONSHIP(Sales[ShipDate], Date[Date])). You cannot have two active relationships between the same tables simultaneously.',
    references: [LEARN('en-us/dax/userelationship-function-dax', 'USERELATIONSHIP function (DAX)')]
  },
  {
    variant: 'p5', domain: 'Model the data', type: 'SINGLE', isTeaser: true,
    stem: 'You want to use time-intelligence functions such as TOTALYTD and SAMEPERIODLASTYEAR reliably. What must your model contain?',
    options: [
      { id: 'A', text: 'A dedicated date table marked as a date table, with a contiguous range of dates' },
      { id: 'B', text: 'Auto date/time disabled on every column' },
      { id: 'C', text: 'A measure for every month' },
      { id: 'D', text: 'A many-to-many relationship to the fact table' }
    ],
    correct: ['A'],
    explanation: 'Time-intelligence functions require a well-formed date table that contains a continuous range of dates covering the data, ideally marked as a date table. This ensures functions like TOTALYTD operate over a complete, gap-free calendar.',
    references: [LEARN('en-us/power-bi/guidance/model-date-tables', 'Create date tables in Power BI Desktop')]
  },
  {
    variant: 'p5', domain: 'Model the data', type: 'SINGLE', isTeaser: true,
    stem: 'After creating your own calendar table, why would you use the "Mark as date table" option in Power BI Desktop?',
    options: [
      { id: 'A', text: 'So time-intelligence functions use your table\'s date column instead of the built-in auto date/time hierarchies' },
      { id: 'B', text: 'To compress the table and reduce model size automatically' },
      { id: 'C', text: 'To create relationships to every fact table automatically' },
      { id: 'D', text: 'To enable incremental refresh on the table' }
    ],
    correct: ['A'],
    explanation: 'Marking a table as the date table tells Power BI to use its date column for time intelligence and removes reliance on the automatic per-column date hierarchies. You select the column that contains unique, contiguous date values.',
    references: [LEARN('en-us/power-bi/transform-model/desktop-date-tables', 'Set and use date tables in Power BI Desktop')]
  },
  {
    variant: 'p5', domain: 'Model the data', type: 'MULTI', isTeaser: true,
    stem: 'A single Date dimension must relate to both OrderDate and ShipDate in the fact table (a role-playing dimension). Which TWO approaches are valid ways to model this in Power BI? (Select all that apply.)',
    options: [
      { id: 'A', text: 'Create both relationships to one Date table; keep one active and activate the other with USERELATIONSHIP inside measures' },
      { id: 'B', text: 'Load a second copy of the Date table and create an active relationship for the second role' },
      { id: 'C', text: 'Use a many-to-many relationship on both date columns' },
      { id: 'D', text: 'Concatenate OrderDate and ShipDate into a single column' }
    ],
    correct: ['A', 'B'],
    explanation: 'A role-playing dimension can be handled with a single date table plus an inactive relationship activated via USERELATIONSHIP, or by loading a second copy of the dimension so both roles can filter simultaneously in the UI. Many-to-many and concatenation are not appropriate solutions here.',
    references: [LEARN('en-us/power-bi/guidance/relationships-active-inactive', 'Active vs inactive relationship guidance — Power BI')]
  },
  {
    variant: 'p5', domain: 'Model the data', type: 'SINGLE', isTeaser: true,
    stem: 'In a calculated column on the Sales fact table, you need to bring in the Category value from the related Product dimension (the one-side). Which DAX function should you use?',
    options: [
      { id: 'A', text: 'RELATED' },
      { id: 'B', text: 'RELATEDTABLE' },
      { id: 'C', text: 'LOOKUPVALUE applied to itself' },
      { id: 'D', text: 'EARLIER' }
    ],
    correct: ['A'],
    explanation: 'RELATED retrieves a value from the "one" side of a relationship into the "many" side, which is exactly the Sales→Product direction. RELATEDTABLE returns the related rows from the many side and is used from the one side.',
    references: [LEARN('en-us/dax/related-function-dax', 'RELATED function (DAX)')]
  },
  {
    variant: 'p5', domain: 'Model the data', type: 'SINGLE', isTeaser: true,
    stem: 'Why is it considered good practice to store intermediate results in DAX variables (VAR ... RETURN) within a complex measure?',
    options: [
      { id: 'A', text: 'It improves readability and can improve performance because a variable is evaluated once and reused' },
      { id: 'B', text: 'Variables are stored in the model and reduce file size' },
      { id: 'C', text: 'Variables automatically create relationships' },
      { id: 'D', text: 'Variables bypass filter context entirely' }
    ],
    correct: ['A'],
    explanation: 'A DAX variable is evaluated once where it is defined and then reused, which avoids recomputing the same sub-expression and makes the measure easier to read and debug. Variables are not stored in the model.',
    references: [LEARN('en-us/dax/var-dax', 'VAR — DAX')]
  },
  {
    variant: 'p5', domain: 'Model the data', type: 'SINGLE', isTeaser: true,
    stem: 'You need a measure that multiplies Quantity by UnitPrice for each row of Sales and then sums the result. Which type of DAX function performs this row-by-row evaluation?',
    options: [
      { id: 'A', text: 'An iterator function such as SUMX' },
      { id: 'B', text: 'A simple aggregator such as SUM' },
      { id: 'C', text: 'A filter function such as ALL' },
      { id: 'D', text: 'A relationship function such as RELATED' }
    ],
    correct: ['A'],
    explanation: 'SUMX is an iterator: it evaluates the expression (Quantity * UnitPrice) for each row of the table and then sums those results. A plain SUM can only add a single column and cannot multiply two columns per row.',
    references: [LEARN('en-us/dax/sumx-function-dax', 'SUMX function (DAX)')]
  },
  {
    variant: 'p5', domain: 'Model the data', type: 'TRUE_FALSE', isTeaser: true,
    stem: 'True or False: Setting a relationship\'s cross-filter direction to "Both" everywhere in a model is a recommended default that has no downside.',
    options: [
      { id: 'A', text: 'True' },
      { id: 'B', text: 'False' }
    ],
    correct: ['B'],
    explanation: 'False. Bidirectional cross-filtering can create filter-propagation ambiguity and degrade performance. Single direction is the recommended default; "Both" should be applied deliberately only where a scenario requires it.',
    references: [LEARN('en-us/power-bi/guidance/relationships-bidirectional-filtering', 'Bidirectional relationship guidance — Power BI')]
  },
  {
    variant: 'p5', domain: 'Model the data', type: 'SINGLE', isTeaser: true,
    stem: 'Your report has many measures that must be formatted and applied consistently across time periods (Current, YTD, PY, YoY %). Which model feature lets you define these calculations once and apply them to any measure?',
    options: [
      { id: 'A', text: 'Calculation groups' },
      { id: 'B', text: 'What-if parameters' },
      { id: 'C', text: 'Field parameters on the fact table' },
      { id: 'D', text: 'Quick measures only' }
    ],
    correct: ['A'],
    explanation: 'Calculation groups let you define a set of calculation items (e.g. YTD, PY, YoY%) once and apply them to any measure, reducing measure sprawl. They are created in tools such as Tabular Editor against the model.',
    references: [LEARN('en-us/analysis-services/tabular-models/calculation-groups', 'Calculation groups — tabular models')]
  },
  {
    variant: 'p5', domain: 'Model the data', type: 'SINGLE', isTeaser: true,
    stem: 'A DirectQuery model over a very large fact table is slow for high-level summaries. Which modeling feature can pre-summarize data so common aggregate queries are answered from a smaller cached table?',
    options: [
      { id: 'A', text: 'Aggregations' },
      { id: 'B', text: 'Bidirectional relationships' },
      { id: 'C', text: 'Calculated columns' },
      { id: 'D', text: 'Field parameters' }
    ],
    correct: ['A'],
    explanation: 'User-defined aggregations store pre-aggregated data (often in Import mode) that Power BI uses transparently to answer summary queries, falling back to DirectQuery for detail. This dramatically improves performance on large models.',
    references: [LEARN('en-us/power-bi/transform-model/aggregations-advanced', 'User-defined aggregations in Power BI')]
  },
  {
    variant: 'p5', domain: 'Model the data', type: 'SINGLE', isTeaser: true,
    stem: 'To reduce the size of an import model, which action is most effective?',
    options: [
      { id: 'A', text: 'Remove unused, high-cardinality columns and disable the global Auto date/time option' },
      { id: 'B', text: 'Set every relationship to bidirectional' },
      { id: 'C', text: 'Convert all measures to calculated columns' },
      { id: 'D', text: 'Increase the decimal precision of all numeric columns' }
    ],
    correct: ['A'],
    explanation: 'Model size is driven largely by column cardinality. Removing unused/high-cardinality columns and turning off Auto date/time (which silently creates hidden date tables per date column) are well-known size-reduction techniques. The other options increase size or have no effect.',
    references: [LEARN('en-us/power-bi/guidance/import-modeling-data-reduction', 'Data reduction techniques for Import modeling — Power BI')]
  }
];

// ── Manage and secure Power BI (4) ────────────────────────────────────────
const MANAGE: SeedQ[] = [
  {
    variant: 'p2', domain: 'Manage and secure Power BI', type: 'SINGLE',
    stem: 'You define row-level security (RLS) roles with DAX filters in Power BI Desktop and publish the report. Where do you assign actual users or security groups to those roles?',
    options: [
      { id: 'A', text: 'In the Power BI service, on the dataset/semantic model Security settings' },
      { id: 'B', text: 'In Power BI Desktop, in Manage roles' },
      { id: 'C', text: 'In Power Query Editor' },
      { id: 'D', text: 'In the report\'s visual-level filters' }
    ],
    correct: ['A'],
    explanation: 'Roles and their DAX rules are created in Power BI Desktop, but members (users or security groups) are mapped to those roles in the Power BI service via the dataset/semantic model\'s Security dialog.',
    references: [LEARN('en-us/power-bi/enterprise/service-admin-rls', 'Row-level security (RLS) with Power BI')]
  },
  {
    variant: 'p2', domain: 'Manage and secure Power BI', type: 'SINGLE',
    stem: 'A colleague needs to view reports in a workspace but must not edit or publish content. Following least-privilege, which workspace role should you grant?',
    options: [
      { id: 'A', text: 'Viewer' },
      { id: 'B', text: 'Member' },
      { id: 'C', text: 'Contributor' },
      { id: 'D', text: 'Admin' }
    ],
    correct: ['A'],
    explanation: 'The Viewer role grants read-only access to the content of a workspace. Contributor can create/edit content, Member can also share and add others, and Admin has full control — all of which exceed view-only needs.',
    references: [LEARN('en-us/power-bi/collaborate-share/service-roles-new-workspaces', 'Roles in workspaces in Power BI')]
  },
  {
    variant: 'p3', domain: 'Manage and secure Power BI', type: 'SINGLE',
    stem: 'You must implement dynamic row-level security so each user only sees rows where the SalesRep email matches their own sign-in. Which DAX function should the role\'s filter use?',
    options: [
      { id: 'A', text: 'USERPRINCIPALNAME()' },
      { id: 'B', text: 'NOW()' },
      { id: 'C', text: 'SELECTEDVALUE()' },
      { id: 'D', text: 'PATH()' }
    ],
    correct: ['A'],
    explanation: 'Dynamic RLS uses USERPRINCIPALNAME() (or USERNAME()) inside the role\'s table filter, e.g. [SalesRepEmail] = USERPRINCIPALNAME(), so the rules resolve per signed-in user instead of needing a separate role per person.',
    references: [LEARN('en-us/power-bi/enterprise/service-admin-rls', 'Row-level security (RLS) with Power BI — dynamic security')]
  },
  {
    variant: 'p3', domain: 'Manage and secure Power BI', type: 'SINGLE',
    stem: 'A published dataset imports data from an on-premises SQL Server. What is required for scheduled refresh in the Power BI service to reach that source?',
    options: [
      { id: 'A', text: 'An on-premises data gateway configured for the data source' },
      { id: 'B', text: 'Only that the report owner remains signed in' },
      { id: 'C', text: 'DirectQuery storage mode, which never needs a gateway' },
      { id: 'D', text: 'A Power BI Pro license on every viewer' }
    ],
    correct: ['A'],
    explanation: 'To refresh data from an on-premises source, the Power BI service connects through an on-premises data gateway bound to that data source. Without a configured gateway, scheduled refresh against the on-prem source fails.',
    references: [LEARN('en-us/power-bi/connect-data/service-gateway-onprem', 'What is an on-premises data gateway?')]
  }
];

const QUESTIONS: SeedQ[] = [...PREPARE, ...VISUALIZE, ...MODEL, ...MANAGE];

type RegroundResult = {
  trimmed: number;
  removed: number;
  inserted: number;
  perExam: Record<string, { total: number; teasers: number }>;
};

const VARIANT_SLUG: Record<Variant, string> = {
  p1: 'microsoft-pl-300-p1',
  p2: 'microsoft-pl-300-p2',
  p3: 'microsoft-pl-300-p3',
  p4: 'microsoft-pl-300-p4',
  p5: 'microsoft-pl-300-p5'
};

export async function regroundPl300(db: PrismaClient): Promise<RegroundResult> {
  const result: RegroundResult = { trimmed: 0, removed: 0, inserted: 0, perExam: {} };

  // 1. TRIM salvageable leaks catalog-wide (non-dump questions).
  const leakCandidates = await db.question.findMany({
    select: { id: true, stem: true, options: true }
  });
  for (const q of leakCandidates) {
    const opts = Array.isArray(q.options) ? (q.options as Opt[]) : [];
    const optText = opts.map((o) => (typeof o?.text === 'string' ? o.text : '')).join('\n');
    if (!LEAK_RE.test(optText)) continue;
    const blob = `${q.stem}\n${optText}`;
    if (DUMP_RE.test(blob)) continue; // dump → removed below, not trimmed
    const newOpts = opts.map((o) => {
      if (typeof o?.text !== 'string') return o;
      const m = o.text.match(LEAK_RE);
      return m ? { ...o, text: o.text.slice(0, m.index).trim() } : o;
    });
    await db.question.update({ where: { id: q.id }, data: { options: newOpts } });
    result.trimmed++;
  }

  // Resolve the PL-300 exam ids.
  const slugs = Object.values(VARIANT_SLUG);
  const exams = await db.exam.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
  const examIdBySlug = new Map(exams.map((e) => [e.slug, e.id]));

  // 2. REMOVE dump/image questions from PL-300 exams (by content signature).
  for (const examId of examIdBySlug.values()) {
    const qs = await db.question.findMany({ where: { examId }, select: { id: true, stem: true, options: true } });
    const dumpIds = qs
      .filter((q) => {
        const opts = Array.isArray(q.options) ? (q.options as Opt[]) : [];
        const blob = `${q.stem}\n${opts.map((o) => o?.text ?? '').join('\n')}`;
        return DUMP_RE.test(blob);
      })
      .map((q) => q.id);
    if (dumpIds.length) {
      const del = await db.question.deleteMany({ where: { id: { in: dumpIds } } });
      result.removed += del.count;
    }
  }

  // 3. INSERT grounded replacements (delete-and-recreate by tag → idempotent).
  await db.question.deleteMany({ where: { generatedBy: REGROUND_TAG } });
  for (const q of QUESTIONS) {
    const examId = examIdBySlug.get(VARIANT_SLUG[q.variant]);
    if (!examId) continue; // exam not present in this DB; skip safely
    await db.question.create({
      data: {
        examId,
        stem: q.stem,
        type: q.type,
        domain: q.domain,
        difficulty: 3,
        explanation: q.explanation,
        options: q.options,
        correct: q.correct,
        references: q.references,
        status: 'PUBLISHED',
        generatedBy: REGROUND_TAG,
        isTeaser: q.isTeaser ?? false
      }
    });
    result.inserted++;
  }

  // Report final per-exam totals.
  for (const [slug, examId] of examIdBySlug) {
    const [total, teasers] = await Promise.all([
      db.question.count({ where: { examId } }),
      db.question.count({ where: { examId, isTeaser: true } })
    ]);
    result.perExam[slug] = { total, teasers };
  }

  return result;
}
