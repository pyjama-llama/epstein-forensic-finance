# Chronological Data & Visualizing "The Haze Trust"

This document explains the recent changes to how transaction dates are sorted and rendered in the small multiples chart (Chart 4), addressing questions about chronology, missing spikes, and sorting bugs.

## 1. Why Dates Were Not in Chronological Order

In the Details Pane ledger on the right side of the screen, you noticed that transactions (like a $5M incoming wire on 2018-08-20) were severely out of chronological order. 

**The Cause:**
The underlying `graph.json` data contains a few transactions where the exact date is unknown or recorded as `null` in the database. When the JavaScript code attempted to sort the ledger chronologically, it hit these `null` dates and produced a `NaN` (Not A Number) error. In JavaScript, sorting an array with `NaN` mathematically breaks the entire sorting algorithm, resulting in a seemingly randomized order for the rest of the valid dates.

**The Fix:**
The code has been updated to explicitly catch invalid or `null` dates during the chronological sort. Now, all valid dates are perfectly sorted in descending chronological order, and any "Unknown Date" transactions are safely appended to the very bottom of the ledger.

## 2. Visualizing "The Haze Trust" (Same-Day Spikes)

Previously, you asked why the $31M inflow for "The Haze Trust" was not visible on its chart. My initial attempt to fix this involved "changing the chronological order and visually staggering dates."

Here is why that happened and what we are doing instead:

**The Challenge of Overlapping X-Coordinates:**
In data visualization, an Area Chart is drawn from left to right across time (the X-axis).
If The Haze Trust receives a massive inflow of $10M on `2018-08-20` in the morning, and then sends exactly $10M out on `2018-08-20` in the afternoon, both events have the exact same timestamp. 
When D3 (our charting engine) connects those two points, it draws a straight vertical line straight up, and then straight back down on the exact same pixel. A polygon with a width of 0 pixels is invisible on the screen. The $31M peak existed mathematically, but it was visually crushed into a zero-width vertical sliver.

**My Previous (Flawed) Attempt:**
To make the spike visible, I wrote a script that forcefully added 14 days of "fake" time between same-day transactions so the peak would have physical width on the screen. As you correctly pointed out, this is bad practice because users expect raw chronological data to be displayed without artificial distortion.

**The New (Correct) Fix:**
1. **Removed Artificial Staggering:** All dates are now plotted exactly on the timestamp they actually occurred.
2. **Intra-Day Sorting Hierarchy:** If two transactions happen on the exact same date, the system now prioritizes **inflows first**, then outflows. This guarantees the mathematical path always climbs to its true maximum peak *before* dropping back down.
3. **Interpolation:** By ensuring inflows are calculated first on overlapping dates, D3 can now correctly render the spike as a vertical cliff face on that exact date, rather than skipping over it.

## 3. Partially Functioning Crosshairs

You reported that the interactive crosshairs/tooltips were clipping or partially broken. 

**The Cause:**
To prevent the crosshairs from bleeding all the way up into Chart 3, I constrained the hover interaction inside an SVG `<clipPath>` box. However, the box was cut too tight—it stopped exactly at `$0` (the top of the chart limits). If you hovered over a massive peak (like The Haze Trust) that reached the very top of the box, the tooltip text (which is drawn slightly *above* the cursor) was being sliced off by the invisible ceiling.

**The Fix:**
I have extended the ceiling of the `<clipPath>` by 40 pixels vertically. It still prevents the dashed line from bleeding into the entirely different charts above it, but it now affords enough headroom for the text tooltip to render safely.

## 4. Downloading the Data

You asked if you could download the raw transaction ledger to analyze it yourself. 

**The Feature:**
I have added a **"Download CSV"** button to the top-right of the Entity Details Pane. When you click on any entity (e.g., The Haze Trust), simply click this button and your browser will instantly generate and download a clean CSV file containing that specific entity's total sorted chronological ledger (Date, Type, Amount, Counterparty, and Purpose).
