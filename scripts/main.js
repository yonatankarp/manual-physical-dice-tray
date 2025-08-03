// Manual Physical Dice – Self-contained module version
// Injects button and runs the physical-dice entry flow directly (no separate macro needed).

window.MPDT = {
  BUTTON_ID: "manual-physical-button",

  injectButtonIntoDiceTray(root = document) {
    try {
      const tray = root.querySelector(".dice-tray, .dice-tray__container, .dice-tray-container");
      if (!tray) return false;
      if (tray.querySelector(`#${this.BUTTON_ID}`)) return true; // already injected

      const btn = document.createElement("button");
      btn.id = this.BUTTON_ID;
      btn.type = "button";
      btn.title = "Manual physical dice";
      btn.style.marginLeft = "4px";
      btn.innerHTML = `<i class="fas fa-hand-holding-magic"></i> Manual Physical`;
      btn.addEventListener("click", async () => {
        try {
          await MPDT.manualPhysicalRoll();
        } catch (e) {
          console.error("[MPDT] manualPhysicalRoll failed:", e);
          ui.notifications.error("Manual Physical roll failed; see console.");
        }
      });
      tray.appendChild(btn);
      return true;
    } catch (err) {
      console.error("[MPDT] injectButtonIntoDiceTray error:", err);
      return false;
    }
  },

  async manualPhysicalRoll() {
    // replicate the working macro logic here
    const isDieTerm = (t) => t?.constructor?.name === "Die" || t?.faces;
    const termLabel = (t, idx) => `${idx + 1}) ${t.number}d${t.faces}${t.modifiers?.length ? " [" + t.modifiers.join(",") + "]" : ""}`;

    // 1. Formula input
    const formula = await new Promise((resolve) => {
      new Dialog({
        title: "Manual Physical Dice → Enter Formula",
        content: `
          <p>Enter any dice expression (examples: <code>1d20+5</code>, <code>2d6+1d4+3</code>).</p>
          <div class="form-group">
            <label>Formula</label>
            <input type="text" name="formula" value="1d20" style="width:100%;"/>
          </div>
        `,
        buttons: {
          ok: {
            label: "Next",
            callback: (html) => resolve(String(html.find('input[name="formula"]').val() || "").trim())
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null)
          }
        },
        default: "ok"
      }).render(true);
    });
    if (!formula) return;

    // 2. Evaluate roll
    let roll;
    try {
      roll = await new Roll(formula).evaluate({ async: true });
    } catch (e) {
      console.error(e);
      ui.notifications.error(`Invalid formula: ${formula}`);
      return;
    }
    const flatten = (t) => (Array.isArray(t.terms) ? t.terms : [t]);
    const dieTerms = roll.terms.flatMap(flatten).filter(isDieTerm);

    // 3. No dice -> manual total
    if (dieTerms.length === 0) {
      const manualTotal = await new Promise((resolve) => {
        new Dialog({
          title: "No Dice in Formula",
          content: `
            <p>The formula has no dice. Enter the total to post.</p>
            <div class="form-group">
              <label>Total</label>
              <input type="number" name="total" value="0" step="1" style="width:100%;"/>
            </div>
          `,
          buttons: {
            ok: {
              label: "Post",
              callback: (html) => resolve(Number(html.find('input[name="total"]').val() || 0))
            },
            cancel: {
              label: "Cancel",
              callback: () => resolve(null)
            }
          },
          default: "ok"
        }).render(true);
      });
      if (manualTotal == null) return;

      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: game.user?.character }),
        flavor: `Manual total (no dice): <code>${formula}</code><br/>Result: <b>${manualTotal}</b>`
      }, { create: true });
      return;
    }

    // 4. Ask for physical faces + options
    const inputsHtml = dieTerms.map((t, i) => `
      <div class="form-group">
        <label>${termLabel(t, i)} — enter ${t.number} face(s), comma-separated</label>
        <input type="text" name="term_${i}" placeholder="${Array.from({ length: t.number }, () => 1).join(',')}" style="width:100%;"/>
      </div>
    `).join("");

    const userInput = await new Promise((resolve) => {
      new Dialog({
        title: "Enter Physical Dice Faces",
        content: `
          <p>For each die group, type the exact faces you rolled (e.g., "3,5").</p>
          ${inputsHtml}
          <hr/>
          <div class="form-group">
            <label>Show to</label>
            <select name="visibility" style="width:100%;">
              <option value="public">Everyone</option>
              <option value="gm">GM only (whisper)</option>
              <option value="self">Self only</option>
            </select>
          </div>
          <div class="form-group">
            <label>Flavor (optional)</label>
            <input type="text" name="flavor" placeholder="e.g., Physical dice result" style="width:100%;"/>
          </div>
        `,
        buttons: {
          ok: {
            label: "Roll",
            callback: (html) => {
              const out = {
                faces: [],
                visibility: String(html.find('select[name="visibility"]').val() || "public"),
                flavor: String(html.find('input[name="flavor"]').val() || "").trim()
              };
              dieTerms.forEach((t, i) => {
                const raw = String(html.find(`input[name="term_${i}"]`).val() || "").trim();
                const vals = raw ? raw.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n)) : [];
                out.faces.push(vals);
              });
              resolve(out);
            }
          },
          cancel: {
            label: "Cancel",
            callback: () => resolve(null)
          }
        },
        default: "ok"
      }).render(true);
    });
    if (!userInput) return;

    // 5. Override die results
    let termIndex = 0;
    for (const t of roll.terms.flatMap(flatten)) {
      if (!isDieTerm(t)) continue;
      const provided = userInput.faces[termIndex] || [];
      if (provided.length !== t.number) {
        ui.notifications.warn(`Term ${termIndex + 1}: expected ${t.number} face(s) for d${t.faces}, got ${provided.length}. Defaulting missing to 1.`);
      }
      const filled = Array.from({ length: t.number }, (_, i) => {
        const v = Number.isFinite(provided[i]) ? provided[i] : 1;
        const clamped = Math.min(Math.max(1, Math.round(v)), t.faces);
        return { result: clamped, active: true };
      });
      t.results = filled;
      t._evaluated = true;
      termIndex += 1;
    }

    // Recompute total
    if (typeof roll._evaluateTotal === "function") roll._total = roll._evaluateTotal();
    else if (typeof roll.getTotal === "function") roll._total = roll.getTotal();

    // Visibility handling
    let whisper = null;
    let blind = false;
    if (userInput.visibility === "gm") {
      whisper = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
    } else if (userInput.visibility === "self") {
      whisper = [game.user.id];
    }

    // 6. Post result (Dice So Nice will animate)
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: game.user?.character }),
      flavor: userInput.flavor || `Manual physical dice · <code>${formula}</code>`,
      whisper,
      blind
    }, { create: true });
  },

  setupRenderHooks() {
    // Immediate attempt
    this.injectButtonIntoDiceTray();
    // Retry until success for a short window
    const interval = setInterval(() => {
      if (this.injectButtonIntoDiceTray()) clearInterval(interval);
    }, 800);
    setTimeout(() => this.injectButtonIntoDiceTray(), 3000);
  }
};

Hooks.once("ready", () => {
  MPDT.setupRenderHooks();
});
