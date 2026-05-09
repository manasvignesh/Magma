const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

// Colors - Ocean blue & white science theme
const C = {
    darkBlue: "0A2D5A",
    midBlue: "1565C0",
    lightBlue: "1E88E5",
    skyBlue: "E3F2FD",
    accent: "29B6F6",
    white: "FFFFFF",
    offWhite: "F0F7FF",
    textDark: "0D1B2A",
    textMid: "1A3A5C",
    gray: "607D8B",
    lightGray: "ECEFF1",
    green: "2E7D32",
    orange: "E65100",
};

// Icon helper
const { FaWater, FaFlask, FaCheckCircle, FaTimesCircle, FaIndustry, FaCogs, FaLeaf, FaChartBar } = require("react-icons/fa");
const { MdScience, MdFilterAlt, MdOutlineWaterDrop } = require("react-icons/md");
const { BiDroplet } = require("react-icons/bi");

async function iconPng(IconComponent, color, size = 256) {
    const svg = ReactDOMServer.renderToStaticMarkup(
        React.createElement(IconComponent, { color, size: String(size) })
    );
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    return "image/png;base64," + buf.toString("base64");
}

async function main() {
    const pres = new pptxgen();
    pres.layout = "LAYOUT_16x9";
    pres.title = "Colloidal Conditioning in Water Treatment";

    // ─────────────────────────────────────────
    // SLIDE 1: TITLE
    // ─────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBlue };

        // Big decorative circle top-right
        s.addShape(pres.shapes.OVAL, { x: 7.5, y: -1.2, w: 4.5, h: 4.5, fill: { color: C.midBlue, transparency: 60 }, line: { color: C.midBlue, transparency: 60 } });
        s.addShape(pres.shapes.OVAL, { x: 8.2, y: -0.4, w: 3.0, h: 3.0, fill: { color: C.accent, transparency: 75 }, line: { color: C.accent, transparency: 75 } });

        // Bottom wave shape
        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 4.5, w: 10, h: 1.125, fill: { color: C.lightBlue, transparency: 70 }, line: { color: C.lightBlue, transparency: 70 } });

        // Title text
        s.addText("Colloidal Conditioning", {
            x: 0.5, y: 1.0, w: 9, h: 1.1,
            fontSize: 40, bold: true, color: C.white, fontFace: "Calibri",
            align: "center"
        });
        s.addText("in Water Treatment", {
            x: 0.5, y: 2.0, w: 9, h: 0.9,
            fontSize: 36, bold: true, color: C.accent, fontFace: "Calibri",
            align: "center"
        });
        s.addText("A Comprehensive Guide for Students", {
            x: 0.5, y: 3.0, w: 9, h: 0.55,
            fontSize: 16, color: "AACCE8", fontFace: "Calibri",
            align: "center", italic: true
        });

        // Bottom tag
        s.addText("Environmental Engineering  |  Water Science  |  Colloid Chemistry", {
            x: 0, y: 5.1, w: 10, h: 0.4,
            fontSize: 11, color: "88BBDD", fontFace: "Calibri",
            align: "center"
        });
    }

    // ─────────────────────────────────────────
    // SLIDE 2: AGENDA / TABLE OF CONTENTS
    // ─────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.white };

        // Left accent bar
        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.midBlue }, line: { color: C.midBlue } });

        s.addText("Topics Covered", { x: 0.4, y: 0.25, w: 9.2, h: 0.65, fontSize: 30, bold: true, color: C.darkBlue, fontFace: "Calibri" });

        const topics = [
            ["01", "Definition of Colloids & Colloidal Conditioning"],
            ["02", "Principle of Colloidal Conditioning"],
            ["03", "Working Process & Flow Diagram"],
            ["04", "Importance in Water Treatment"],
            ["05", "Advantages"],
            ["06", "Disadvantages"],
            ["07", "Applications"],
            ["08", "Conclusion"],
        ];

        // Two columns
        const col1 = topics.slice(0, 4);
        const col2 = topics.slice(4, 8);

        col1.forEach((t, i) => {
            s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: 1.1 + i * 0.98, w: 0.45, h: 0.45, fill: { color: C.lightBlue }, line: { color: C.lightBlue }, rectRadius: 0.05 });
            s.addText(t[0], { x: 0.35, y: 1.1 + i * 0.98, w: 0.45, h: 0.45, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
            s.addText(t[1], { x: 0.87, y: 1.1 + i * 0.98, w: 3.8, h: 0.45, fontSize: 13, color: C.textDark, fontFace: "Calibri", valign: "middle" });
        });

        col2.forEach((t, i) => {
            s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.1 + i * 0.98, w: 0.45, h: 0.45, fill: { color: C.accent }, line: { color: C.accent }, rectRadius: 0.05 });
            s.addText(t[0], { x: 5.2, y: 1.1 + i * 0.98, w: 0.45, h: 0.45, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
            s.addText(t[1], { x: 5.72, y: 1.1 + i * 0.98, w: 3.9, h: 0.45, fontSize: 13, color: C.textDark, fontFace: "Calibri", valign: "middle" });
        });
    }

    // ─────────────────────────────────────────
    // SLIDE 3: DEFINITION
    // ─────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.offWhite };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.darkBlue }, line: { color: C.darkBlue } });
        s.addText("Definition", { x: 0.4, y: 0, w: 9.2, h: 0.9, fontSize: 26, bold: true, color: C.white, fontFace: "Calibri", valign: "middle" });

        // Colloid definition box
        s.addShape(pres.shapes.RECTANGLE, {
            x: 0.35, y: 1.05, w: 4.4, h: 2.1,
            fill: { color: C.midBlue }, line: { color: C.midBlue },
            shadow: { type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.15 }
        });
        s.addText("What is a Colloid?", { x: 0.35, y: 1.05, w: 4.4, h: 0.5, fontSize: 16, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle", margin: 0 });
        s.addText([
            { text: "A colloid is a mixture where tiny particles (1–1000 nm) are dispersed in a medium without settling.", options: { breakLine: false } }
        ], { x: 0.45, y: 1.6, w: 4.2, h: 1.4, fontSize: 13, color: C.white, fontFace: "Calibri", align: "left" });

        // Conditioning definition box
        s.addShape(pres.shapes.RECTANGLE, {
            x: 5.25, y: 1.05, w: 4.4, h: 2.1,
            fill: { color: C.lightBlue }, line: { color: C.lightBlue },
            shadow: { type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.15 }
        });
        s.addText("What is Conditioning?", { x: 5.25, y: 1.05, w: 4.4, h: 0.5, fontSize: 16, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle", margin: 0 });
        s.addText("The process of altering colloidal particles to make them easier to separate from water during treatment.", { x: 5.35, y: 1.6, w: 4.2, h: 1.4, fontSize: 13, color: C.white, fontFace: "Calibri", align: "left" });

        // Combined definition
        s.addShape(pres.shapes.RECTANGLE, {
            x: 0.35, y: 3.3, w: 9.3, h: 1.7,
            fill: { color: C.skyBlue }, line: { color: C.accent, width: 2 }
        });
        s.addText("Colloidal Conditioning Defined:", { x: 0.55, y: 3.4, w: 9.0, h: 0.4, fontSize: 14, bold: true, color: C.darkBlue, fontFace: "Calibri" });
        s.addText(
            "Colloidal conditioning is the treatment process used to destabilize and aggregate colloidal particles in water — making them large enough to be removed by sedimentation or filtration. It involves chemical addition (coagulants/flocculants) to neutralize charges and promote particle clustering.",
            { x: 0.55, y: 3.82, w: 9.0, h: 1.05, fontSize: 12.5, color: C.textMid, fontFace: "Calibri" }
        );
    }

    // ─────────────────────────────────────────
    // SLIDE 4: PRINCIPLE
    // ─────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.white };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.darkBlue }, line: { color: C.darkBlue } });
        s.addText("Principle of Colloidal Conditioning", { x: 0.4, y: 0, w: 9.2, h: 0.9, fontSize: 24, bold: true, color: C.white, fontFace: "Calibri", valign: "middle" });

        // 3 principle cards
        const principles = [
            { title: "1. Electrical Double Layer", body: "Colloidal particles carry surface charges (usually negative) that attract a layer of counter-ions. This creates stability and prevents settling.", color: C.darkBlue },
            { title: "2. Charge Neutralization", body: "Coagulants (like Alum) are added to neutralize surface charges. This reduces repulsion between particles, allowing them to come closer.", color: C.midBlue },
            { title: "3. Van der Waals Forces", body: "Once charges are neutralized, attractive Van der Waals forces dominate, pulling particles together to form larger aggregates (flocs).", color: C.lightBlue },
        ];

        principles.forEach((p, i) => {
            s.addShape(pres.shapes.RECTANGLE, {
                x: 0.3 + i * 3.25, y: 1.1, w: 3.05, h: 3.5,
                fill: { color: p.color }, line: { color: p.color },
                shadow: { type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.12 }
            });
            s.addText(p.title, { x: 0.35 + i * 3.25, y: 1.15, w: 2.95, h: 0.8, fontSize: 14, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle" });
            s.addText(p.body, { x: 0.4 + i * 3.25, y: 2.05, w: 2.85, h: 2.4, fontSize: 12.5, color: C.white, fontFace: "Calibri", align: "left" });
        });

        // Key equation box
        s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 4.75, w: 9.4, h: 0.65, fill: { color: C.skyBlue }, line: { color: C.accent, width: 1.5 } });
        s.addText("Key Concept: DLVO Theory — Stability = Electrostatic Repulsion vs. Van der Waals Attraction", {
            x: 0.4, y: 4.75, w: 9.2, h: 0.65, fontSize: 13, bold: false, color: C.darkBlue, fontFace: "Calibri", valign: "middle", align: "center", italic: true
        });
    }

    // ─────────────────────────────────────────
    // SLIDE 5: WORKING PROCESS (FLOW DIAGRAM)
    // ─────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.offWhite };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.darkBlue }, line: { color: C.darkBlue } });
        s.addText("Working Process — Flow Diagram", { x: 0.4, y: 0, w: 9.2, h: 0.9, fontSize: 24, bold: true, color: C.white, fontFace: "Calibri", valign: "middle" });

        // Flow steps
        const steps = [
            { num: "1", label: "Raw Water\nInlet", color: C.midBlue },
            { num: "2", label: "Coagulant\nAddition", color: C.lightBlue },
            { num: "3", label: "Rapid\nMixing", color: C.midBlue },
            { num: "4", label: "Slow\nFlocculation", color: C.lightBlue },
            { num: "5", label: "Sedimentation\n/ Settling", color: C.midBlue },
            { num: "6", label: "Filtration &\nClear Water", color: "1565C0" },
        ];

        const boxW = 1.35, boxH = 1.1, startX = 0.2, stepY = 2.0;
        const gap = (10 - startX * 2 - steps.length * boxW) / (steps.length - 1);

        steps.forEach((st, i) => {
            const x = startX + i * (boxW + gap);
            s.addShape(pres.shapes.RECTANGLE, {
                x, y: stepY, w: boxW, h: boxH,
                fill: { color: st.color }, line: { color: st.color },
                shadow: { type: "outer", blur: 5, offset: 2, angle: 135, color: "000000", opacity: 0.15 }
            });
            s.addText(st.num, { x, y: stepY, w: boxW, h: 0.35, fontSize: 14, bold: true, color: C.accent, align: "center", valign: "middle", margin: 0 });
            s.addText(st.label, { x, y: stepY + 0.35, w: boxW, h: 0.75, fontSize: 11, color: C.white, fontFace: "Calibri", align: "center", valign: "middle", margin: 0 });

            // Arrow
            if (i < steps.length - 1) {
                s.addShape(pres.shapes.LINE, {
                    x: x + boxW, y: stepY + boxH / 2, w: gap, h: 0,
                    line: { color: C.accent, width: 2.5 }
                });
                // Arrowhead
                s.addText("▶", { x: x + boxW + gap - 0.25, y: stepY + boxH / 2 - 0.18, w: 0.3, h: 0.35, fontSize: 12, color: C.accent, align: "center" });
            }
        });

        // Process details below
        const details = [
            { step: "Coagulant Addition", detail: "Alum [Al₂(SO₄)₃] or FeCl₃ added to neutralize charges" },
            { step: "Rapid Mixing", detail: "High turbulence ensures chemical contact with all particles" },
            { step: "Flocculation", detail: "Gentle stirring promotes micro-floc growth into larger flocs" },
            { step: "Sedimentation", detail: "Gravity separates dense flocs from clarified water" },
        ];

        details.forEach((d, i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const x = 0.3 + col * 5.0, y = 3.35 + row * 0.78;
            s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.7, h: 0.68, fill: { color: C.skyBlue }, line: { color: C.lightBlue, width: 1 } });
            s.addText(`${d.step}: `, { x: x + 0.12, y, w: 1.5, h: 0.68, fontSize: 12, bold: true, color: C.darkBlue, fontFace: "Calibri", valign: "middle" });
            s.addText(d.detail, { x: x + 1.45, y, w: 3.1, h: 0.68, fontSize: 11.5, color: C.textMid, fontFace: "Calibri", valign: "middle" });
        });
    }

    // ─────────────────────────────────────────
    // SLIDE 6: IMPORTANCE
    // ─────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.white };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.darkBlue }, line: { color: C.darkBlue } });
        s.addText("Importance of Colloidal Conditioning", { x: 0.4, y: 0, w: 9.2, h: 0.9, fontSize: 24, bold: true, color: C.white, fontFace: "Calibri", valign: "middle" });

        const points = [
            { icon: "💧", title: "Safe Drinking Water", text: "Removes turbidity-causing particles, bacteria, viruses, and pathogens that cause disease." },
            { icon: "🏭", title: "Industrial Water Quality", text: "Ensures process water purity for manufacturing, pharmaceuticals, and electronics." },
            { icon: "🌿", title: "Environmental Protection", text: "Reduces pollutant discharge into water bodies, protecting aquatic ecosystems." },
            { icon: "⚗️", title: "Enables Downstream Treatment", text: "Pre-clarified water is essential for effective chlorination and UV disinfection." },
            { icon: "💰", title: "Cost Efficiency", text: "Reduces filter clogging and extends equipment lifespan — lowering operational costs." },
            { icon: "🔬", title: "Removal of Micro-pollutants", text: "Floc particles adsorb heavy metals, pesticides, and organic contaminants." },
        ];

        points.forEach((p, i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const x = 0.25 + col * 5.0, y = 1.05 + row * 1.5;
            s.addShape(pres.shapes.RECTANGLE, {
                x, y, w: 4.65, h: 1.35,
                fill: { color: i % 2 === 0 ? C.skyBlue : "EBF5FB" }, line: { color: C.lightBlue, width: 1 },
                shadow: { type: "outer", blur: 4, offset: 2, angle: 135, color: "000000", opacity: 0.08 }
            });
            s.addText(p.icon + " " + p.title, { x: x + 0.15, y: y + 0.1, w: 4.35, h: 0.38, fontSize: 13.5, bold: true, color: C.darkBlue, fontFace: "Calibri" });
            s.addText(p.text, { x: x + 0.15, y: y + 0.52, w: 4.35, h: 0.75, fontSize: 12, color: C.textMid, fontFace: "Calibri" });
        });
    }

    // ─────────────────────────────────────────
    // SLIDE 7: ADVANTAGES
    // ─────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.offWhite };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.midBlue }, line: { color: C.midBlue } });
        s.addText("✅  Advantages of Colloidal Conditioning", { x: 0.4, y: 0, w: 9.2, h: 0.9, fontSize: 24, bold: true, color: C.white, fontFace: "Calibri", valign: "middle" });

        const advs = [
            "Highly effective in removing suspended solids, turbidity, and colloidal matter",
            "Removes a broad range of contaminants including bacteria, viruses, and heavy metals",
            "Well-established technology with decades of proven performance globally",
            "Can be adapted to treat varying water qualities and flow rates",
            "Relatively low capital cost compared to membrane technologies",
            "Works synergistically with other treatment methods (sand filtration, disinfection)",
            "Reduces chemical oxygen demand (COD) and biological oxygen demand (BOD)",
            "Improves taste, odor, and color of treated water",
        ];

        advs.forEach((a, i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const x = 0.3 + col * 5.0, y = 1.05 + row * 1.05;
            s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.42, h: 0.42, fill: { color: C.green }, line: { color: C.green } });
            s.addText("✓", { x, y, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
            s.addText(a, { x: x + 0.5, y, w: 4.3, h: 0.82, fontSize: 12.5, color: C.textDark, fontFace: "Calibri", valign: "middle" });
        });
    }

    // ─────────────────────────────────────────
    // SLIDE 8: DISADVANTAGES
    // ─────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.white };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.9, fill: { color: "B71C1C" }, line: { color: "B71C1C" } });
        s.addText("⚠️  Disadvantages of Colloidal Conditioning", { x: 0.4, y: 0, w: 9.2, h: 0.9, fontSize: 24, bold: true, color: C.white, fontFace: "Calibri", valign: "middle" });

        const disadvs = [
            { pt: "Sludge Generation", text: "Produces large volumes of chemical sludge that require careful disposal — increasing operational complexity." },
            { pt: "Chemical Costs", text: "Continuous use of coagulants (Alum, FeCl₃) and flocculants adds to treatment costs over time." },
            { pt: "pH Sensitivity", text: "Coagulation is highly pH-dependent; performance drops significantly outside optimal pH range (6–8)." },
            { pt: "Residual Chemicals", text: "Trace aluminum or iron from coagulants can remain in treated water, posing potential health concerns." },
            { pt: "Skilled Operation Needed", text: "Requires trained operators and regular jar testing to adjust dosing for changing raw water quality." },
            { pt: "Limited for Dissolved Pollutants", text: "Ineffective against dissolved contaminants (nitrates, fluoride) — additional processes are needed." },
        ];

        disadvs.forEach((d, i) => {
            const col = i % 2, row = Math.floor(i / 2);
            const x = 0.3 + col * 5.0, y = 1.05 + row * 1.45;
            s.addShape(pres.shapes.RECTANGLE, {
                x, y, w: 4.65, h: 1.3,
                fill: { color: "FFF5F5" }, line: { color: "FFCDD2", width: 1.5 }
            });
            s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.15, h: 1.3, fill: { color: "EF5350" }, line: { color: "EF5350" } });
            s.addText(d.pt, { x: x + 0.22, y: y + 0.1, w: 4.3, h: 0.4, fontSize: 13, bold: true, color: "C62828", fontFace: "Calibri" });
            s.addText(d.text, { x: x + 0.22, y: y + 0.52, w: 4.3, h: 0.7, fontSize: 11.5, color: C.textMid, fontFace: "Calibri" });
        });
    }

    // ─────────────────────────────────────────
    // SLIDE 9: APPLICATIONS
    // ─────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.offWhite };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.darkBlue }, line: { color: C.darkBlue } });
        s.addText("Applications of Colloidal Conditioning", { x: 0.4, y: 0, w: 9.2, h: 0.9, fontSize: 24, bold: true, color: C.white, fontFace: "Calibri", valign: "middle" });

        const apps = [
            { icon: "🏙️", title: "Municipal Water Treatment", text: "Drinking water plants worldwide use coagulation-flocculation as the primary treatment step before filtration." },
            { icon: "🏭", title: "Industrial Wastewater", text: "Textile, paper, mining, and food industries use colloidal conditioning to meet discharge standards." },
            { icon: "💊", title: "Pharmaceutical Industry", text: "Ultrapure water production requires colloid removal to prevent product contamination." },
            { icon: "⚡", title: "Power Plants", text: "Cooling water systems require colloidal treatment to prevent scaling and biofouling in heat exchangers." },
            { icon: "🌊", title: "Swimming Pools", text: "Clarification of pool water uses coagulants to remove fine particles, algae, and bacteria." },
            { icon: "🌱", title: "Agricultural Water", text: "Irrigation water treatment removes clay colloids and pesticide residues for crop safety." },
        ];

        apps.forEach((a, i) => {
            const col = i % 3, row = Math.floor(i / 3);
            const x = 0.2 + col * 3.3, y = 1.05 + row * 2.1;
            s.addShape(pres.shapes.RECTANGLE, {
                x, y, w: 3.1, h: 1.95,
                fill: { color: C.white }, line: { color: C.lightBlue, width: 1.5 },
                shadow: { type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.1 }
            });
            s.addShape(pres.shapes.RECTANGLE, { x, y, w: 3.1, h: 0.55, fill: { color: C.lightBlue }, line: { color: C.lightBlue } });
            s.addText(a.icon + "  " + a.title, { x: x + 0.1, y, w: 2.9, h: 0.55, fontSize: 12.5, bold: true, color: C.white, fontFace: "Calibri", valign: "middle", margin: 0 });
            s.addText(a.text, { x: x + 0.1, y: y + 0.6, w: 2.9, h: 1.3, fontSize: 11.5, color: C.textMid, fontFace: "Calibri" });
        });
    }

    // ─────────────────────────────────────────
    // SLIDE 10: CHEMICALS USED (BONUS)
    // ─────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.white };

        s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.9, fill: { color: C.midBlue }, line: { color: C.midBlue } });
        s.addText("Common Chemicals Used in Colloidal Conditioning", { x: 0.4, y: 0, w: 9.2, h: 0.9, fontSize: 22, bold: true, color: C.white, fontFace: "Calibri", valign: "middle" });

        // Table
        const tableRows = [
            [{ text: "Chemical", options: { bold: true, color: C.white, fill: { color: C.darkBlue }, fontSize: 13 } },
            { text: "Type", options: { bold: true, color: C.white, fill: { color: C.darkBlue }, fontSize: 13 } },
            { text: "Optimal pH", options: { bold: true, color: C.white, fill: { color: C.darkBlue }, fontSize: 13 } },
            { text: "Common Use", options: { bold: true, color: C.white, fill: { color: C.darkBlue }, fontSize: 13 } }],
            ["Aluminum Sulfate (Alum)", "Inorganic Coagulant", "6.0 – 8.0", "Municipal drinking water"],
            ["Ferric Chloride (FeCl₃)", "Inorganic Coagulant", "5.0 – 8.5", "Wastewater, high turbidity"],
            ["Ferrous Sulfate", "Inorganic Coagulant", "8.5 – 11.0", "Industrial effluent"],
            ["Polyaluminum Chloride (PAC)", "Inorganic Polymer", "6.0 – 9.0", "Low turbidity water"],
            ["Polyacrylamide (PAM)", "Organic Flocculant", "Wide range", "Floc strengthening"],
            ["Activated Silica", "Coagulant Aid", "Neutral", "Enhances floc density"],
        ];

        s.addTable(tableRows, {
            x: 0.3, y: 1.05, w: 9.4, h: 4.3,
            border: { pt: 1, color: "BBDEFB" },
            rowH: 0.6,
            colW: [2.4, 2.1, 1.6, 3.3],
            fontFace: "Calibri",
            fontSize: 12,
            align: "left",
            color: C.textDark,
            autoPage: false,
            fill: { color: C.white },
        });
    }

    // ─────────────────────────────────────────
    // SLIDE 11: CONCLUSION
    // ─────────────────────────────────────────
    {
        const s = pres.addSlide();
        s.background = { color: C.darkBlue };

        // Decorative circles
        s.addShape(pres.shapes.OVAL, { x: -1, y: 3, w: 4, h: 4, fill: { color: C.midBlue, transparency: 70 }, line: { color: C.midBlue, transparency: 70 } });
        s.addShape(pres.shapes.OVAL, { x: 7.5, y: -0.5, w: 3.5, h: 3.5, fill: { color: C.accent, transparency: 75 }, line: { color: C.accent, transparency: 75 } });

        s.addText("Conclusion", { x: 0.5, y: 0.25, w: 9, h: 0.75, fontSize: 30, bold: true, color: C.white, fontFace: "Calibri", align: "center" });

        // Summary box
        s.addShape(pres.shapes.RECTANGLE, {
            x: 0.5, y: 1.1, w: 9, h: 1.5,
            fill: { color: C.midBlue, transparency: 20 }, line: { color: C.accent, width: 2 }
        });
        s.addText(
            "Colloidal conditioning is a cornerstone of modern water treatment. By destabilizing charged particles through coagulation and flocculation, it enables the efficient removal of turbidity, pathogens, and pollutants — making water safe for human use and protecting the environment.",
            { x: 0.65, y: 1.18, w: 8.7, h: 1.35, fontSize: 13, color: C.white, fontFace: "Calibri", align: "center", valign: "middle" }
        );

        const keyTakes = [
            "Colloids are stabilized by surface charges — conditioning neutralizes these charges",
            "Coagulation + Flocculation + Sedimentation = Core treatment sequence",
            "Alum and FeCl₃ are the most widely used coagulants globally",
            "Despite sludge generation, it remains the most cost-effective large-scale method",
            "Essential for safe drinking water supply to billions of people worldwide",
        ];

        s.addText("Key Takeaways:", { x: 0.5, y: 2.75, w: 9, h: 0.42, fontSize: 15, bold: true, color: C.accent, fontFace: "Calibri" });

        s.addText(
            keyTakes.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < keyTakes.length - 1 } })),
            { x: 0.5, y: 3.2, w: 9, h: 2.0, fontSize: 12.5, color: "CCE5FF", fontFace: "Calibri" }
        );
    }

    await pres.writeFile({ fileName: "Colloidal_Conditioning_Water_Treatment.pptx" });
    console.log("Done!");
}

main().catch(console.error);