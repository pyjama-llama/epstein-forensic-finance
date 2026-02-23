# Chronological Data & Visualizing "The Haze Trust"

This document explains the recent changes to how transaction dates are sorted and rendered in the small multiples chart (Chart 4), addressing questions about chronology, missing spikes, and sorting bugs.

## 1. Why Dates Appear "Out of Order" in the Ledger/CSV

You noticed that in the Details Pane ledger (and the CSV), a `$5M` Outflow on `2018-08-20` is listed *above* the `$5M` Inflow on `2018-08-20`. "How can it go out before it comes in?"

**The Answer:** 
The CSV and the Details Pane are currently sorted in **Descending Order** (Newest transactions at the top, Oldest at the bottom). 
On August 20, The Haze Trust received $5M in the morning (Event 1), and wired $5M out in the afternoon (Event 2). Because Event 2 is the *newer* transaction, it naturally sits *higher* on a descending list. 

**Recommendation:** 
While most financial databases export ledgers descending, this can be confusing for narrative analysis. I highly recommend **flipping the Details Pane and CSV export to Ascending Order** (Oldest at the top). This way, the story reads chronologically from top to bottom, and same-day Inflows will correctly appear above Outflows.

## 2. Visually Fixing "The Haze Trust" Spikes & Broken Crosshairs

When we plot transactions faithfully on a rigid chronological timeline, we encounter a visualization geometry problem with **same-day wash trades**.

If $31M enters The Haze Trust and $31M leaves The Haze Trust on the **exact same day**, the math algorithm draws a line straight up, and then straight back down on the **exact same horizontal pixel**. 
A polygon chart with a width of 0 pixels is physically invisible, and the peak disappears.

Furthermore, when you try to hover your mouse over that pixel, the tooltip engine has to guess whether you are looking at the $31M peak (morning) or the $0 trough (afternoon) because they share the same pixel line. It defaults to the latter ($0), which makes the crosshairs feel "partially functioning" or missing.

**To solve this, we have three architectural paths for the visualization:**

### Option A (Data Integrity): The "Y-Axis Snap"
We keep true chronological time in the data exactly as it is. We fix the crosshair by upgrading its logic: when you hover over a 0-width spike, it calculates whether your mouse is closer to the top of the spike or the bottom, and snaps to the correct balancing act.
* **Pro:** 100% data integrity. Zero time falsification.
* **Con:** The spikes remain 1-pixel-thin "needles" on the chart because they enter and exit instantly.

### Option B (Visual Clarity): The "24-Hour Clearing Offset"
We introduce a microscopic rule to the visual engine: "All outgoing transfers visually take 24 hours to clear." 
* **Pro:** This gives the same-day wash trades a physical 1-day width on the exact time-axis, creating thick, highly visible "plateaus". The crosshairs will work flawlessly because the Peak and the Drop no longer share the same vertical column.
* **Con:** We technically bend the visual timeline by 1 day.

### Option C: Ordinal Sequence Chart
Instead of Time (Years) on the bottom, the X-axis becomes an "Event Sequence" (`1st tx, 2nd tx, 3rd tx`). 
* **Pro:** Every single transaction gets an equally massive, highly visible horizontal block to hover over, regardless of the date.
* **Con:** We lose the visual representation of "time gaps". A 3-year dormant gap looks exactly the same as a 1-day gap.

**My Recommendation:** I suggest we implement **Option A** for the small multiples to preserve exact data integrity, and immediately switch the Details Pane/CSV to **Ascending Order** so the chronological flow is readable.
