// Offline audit calculations. Semantic decisions are explicit input annotations.
export const personaIds = ["truong-chinh", "le-duan", "pham-van-dong", "vo-nguyen-giap"];
const channels = ["neutral", ...personaIds];
const classify = flags => flags.every(Boolean) ? "covered" : flags.some(Boolean) ? "partially_covered" : "uncovered";
const norm = s => s.normalize("NFC").replace(/\s+/gu, " ").trim().toLocaleLowerCase("vi-VN");
const idFor = n => `cmtt45-q${String(n).padStart(3, "0")}`;
const answer = (q, channel) => channel === "neutral" ? q.approvedAnswer : q.characterAnswers[channel];

export function stats(statuses) {
  const total = statuses.length;
  const covered = statuses.filter(s => s === "covered").length;
  const partially_covered = statuses.filter(s => s === "partially_covered").length;
  const uncovered = total - covered - partially_covered;
  const percent = n => total ? Number((n / total * 100).toFixed(2)) : 0;
  return { total, covered, partially_covered, uncovered, strictPercent: percent(covered), partialCreditPercent: percent(covered + 0.5 * partially_covered), anyCoveragePercent: percent(covered + partially_covered) };
}

function assess(facets) {
  const channelCoverage = Object.fromEntries(channels.map(channel => [channel, classify(facets.map(f => f.channelEvidence[channel].length > 0))]));
  return {
    coverage: classify(facets.flatMap(f => channels.map(c => f.channelEvidence[c].length > 0))),
    neutralCoverage: channelCoverage.neutral,
    personaCoverage: classify(facets.flatMap(f => personaIds.map(c => f.channelEvidence[c].length > 0))),
    characterCoverage: Object.fromEntries(personaIds.map(c => [c, channelCoverage[c]])),
  };
}

function aggregate(rows) {
  return {
    ...stats(rows.map(row => row.coverage)),
    neutral: stats(rows.map(row => row.neutralCoverage)),
    personas: stats(rows.map(row => row.personaCoverage)),
    characters: Object.fromEntries(personaIds.map(c => [c, stats(rows.map(row => row.characterCoverage[c]))])),
  };
}

export function auditCoverage(baselineAudit, baselineQuestions, questions, additions) {
  const oldMap = new Map(baselineQuestions.map(q => [q._id, q]));
  const nextMap = new Map(questions.map(q => [q._id, q]));
  const units = baselineAudit.units.map(oldUnit => {
    const facets = oldUnit.facets.map(oldFacet => {
      const channelEvidence = Object.fromEntries(channels.map(channel => {
        const inheritedIds = channel === "neutral" ? oldFacet.neutralQuestionIds : oldFacet.personaQuestionIds;
        const evidence = inheritedIds.flatMap(questionId => {
          const old = oldMap.get(questionId), next = nextMap.get(questionId);
          if (!old || !next) return [];
          // Reuse only an unchanged answer OR its retained neutral evidence.
          // Do not blindly transfer old persona annotations after a rewrite.
          const unchanged = answer(old, channel) === answer(next, channel);
          // Persona formatting can insert bullets/transitions BETWEEN clauses.
          // Every original neutral paragraph must still occur in full.
          const retained = oldFacet.neutralQuestionIds.includes(questionId) && old.approvedAnswer.split("\n").filter(Boolean).every(clause => norm(answer(next, channel)).includes(norm(clause)));
          return unchanged || retained ? [{ questionId, version: next.version, channel, basis: unchanged ? "baseline_annotation_unchanged_answer" : "baseline_neutral_annotation_retained_in_full", answerPath: channel === "neutral" ? "approvedAnswer" : `characterAnswers.${channel}` }] : [];
        });
        const addition = additions[oldFacet.id];
        if (addition) {
          const questionId = idFor(addition.question), next = nextMap.get(questionId);
          if (next && addition.anchors.every(anchor => norm(answer(next, channel)).includes(norm(anchor)))) {
            evidence.push({ questionId, version: next.version, channel, basis: "phase_2_5_manual_source_grounded_annotation", answerPath: channel === "neutral" ? "approvedAnswer" : `characterAnswers.${channel}`, verifiedAnchors: addition.anchors, sourceBlockIds: next.source.blockIds });
          }
        }
        return [channel, evidence];
      }));
      return {
        id: oldFacet.id, claim: oldFacet.claim, sourceBlockIds: oldFacet.sourceBlockIds, sections: oldFacet.sections,
        channelEvidence,
        neutralCovered: channelEvidence.neutral.length > 0,
        allFourPersonasCovered: personaIds.every(c => channelEvidence[c].length > 0),
        covered: channels.every(c => channelEvidence[c].length > 0),
        annotation: additions[oldFacet.id] || null,
      };
    });
    return {
      id: oldUnit.id, title: oldUnit.title, sourceBlockIds: oldUnit.sourceBlockIds,
      sections: oldUnit.sections, types: oldUnit.types, importance: oldUnit.importance,
      previousCoverage: oldUnit.coverage, previousNote: oldUnit.note,
      facets, ...assess(facets),
      missingFacetsByChannel: Object.fromEntries(channels.map(c => [c, facets.filter(f => !f.channelEvidence[c].length).map(f => f.id)])),
      humanReviewRequired: true,
      sourceReconciliation: ["K062", "K063"].includes(oldUnit.id) ? "bounded_answer_only_needs_admin_review" : null,
    };
  });
  const unitMap = new Map(units.map(unit => [unit.id, unit]));
  const sections = baselineAudit.sections.map(section => {
    const assessments = section.assessments.map(old => {
      const facets = unitMap.get(old.unitId).facets.filter(f => old.facetIds.includes(f.id));
      return { unitId: old.unitId, facetIds: old.facetIds, ...assess(facets) };
    });
    return { sectionId: section.sectionId, title: section.title, unitIds: section.unitIds, assessments, before: { total: section.total, covered: section.covered, partially_covered: section.partially_covered, uncovered: section.uncovered, strictPercent: section.strictPercent }, ...aggregate(assessments) };
  });
  return {
    units, sections, summary: { ...aggregate(units), uniqueFacets: units.reduce((n, u) => n + u.facets.length, 0), sectionMembershipCount: sections.reduce((n, s) => n + s.unitIds.length, 0) },
    remainingGaps: units.filter(u => u.coverage !== "covered").map(u => ({ unitId: u.id, status: u.coverage, missing: u.missingFacetsByChannel })),
  };
}

export function evaluateMatching(cases, questions, match, normalize) {
  const entries = questions.map(q => ({ questionId: q._id, revisionId: `${q._id}:v${q.version}`, canonicalQuestion: q.canonicalQuestion, aliases: q.aliases }));
  const declared = new Set(questions.flatMap(q => [q.canonicalQuestion, ...q.aliases].map(normalize)));
  const results = cases.map(probe => {
    const result = match(probe.query, entries);
    const returnedQuestionIds = result.type === "exact" ? [result.entry.questionId] : result.type === "suggest" ? result.suggestions.map(s => s.questionId) : [];
    return {
      ...probe, declaredOverlap: declared.has(normalize(probe.query)), matcherResult: result.type, returnedQuestionIds,
      expectedCandidateFound: probe.expectedQuestionIds.some(id => returnedQuestionIds.includes(id)),
      unsafeAutoAnswer: result.type === "exact" && (probe.mustNotAutoAnswer || !probe.expectedQuestionIds.includes(result.entry.questionId)),
    };
  });
  const supported = results.filter(r => r.constraint === "supported_intent");
  return {
    total: results.length, exact: results.filter(r => r.matcherResult === "exact").length,
    suggest: results.filter(r => r.matcherResult === "suggest").length, none: results.filter(r => r.matcherResult === "none").length,
    declaredOverlap: results.filter(r => r.declaredOverlap).length,
    unsafeAutoAnswers: results.filter(r => r.unsafeAutoAnswer).length,
    supportedIntentCount: supported.length, supportedTop3Hits: supported.filter(r => r.expectedCandidateFound).length,
    supportedTop3Percent: supported.length ? Number((supported.filter(r => r.expectedCandidateFound).length / supported.length * 100).toFixed(2)) : null,
    // Safe abstention from automatic answers is NOT the same as relevant suggestions.
    unsupportedOrMixedSuggestions: results.filter(r => ["unsupported", "mixed_scope", "no_combined_answer"].includes(r.constraint) && r.matcherResult === "suggest").map(r => r.id),
    results,
  };
}

export function coverageMarkdown(audit) {
  const s = audit.summary, hold = audit.expressionAudit.holdout;
  const table = (headers, rows) => ["| " + headers.join(" | ") + " |", "| " + headers.map(() => "---").join(" | ") + " |", ...rows.map(row => "| " + row.join(" | ") + " |")].join("\n");
  return [
    "# Knowledge Coverage Audit — bộ dữ liệu v4 (Phase 2.5)", "",
    `Ngày ${audit.auditDate}. Snapshot ${audit.questionEvidence.length} logical questions, tất cả draft. Theo cùng rubric 92 đơn vị / 136 facets, kết quả đối chiếu là **${s.covered}/92 = ${s.strictPercent}% covered**, ${s.partially_covered} partially_covered, ${s.uncovered} uncovered. Đây là coverage nội dung bản nháp, không chứng nhận lịch sử và không phải tỷ lệ câu hỏi người chơi được chatbot trả lời.`, "",
    "## Phương pháp và tính so sánh", "",
    "Giữ nguyên ID K001–K092, toàn bộ claims, 136 facets, locator và phân bổ I–X từ audit cũ. Không chia nhỏ mẫu số để nâng tỷ lệ. Mỗi unit trọng số 1, bốn persona là bốn lớp kiểm tra cùng kiến thức, không nhân số đơn vị lên bốn lần. Các mục có 151 lượt xuất hiện, không cộng mẫu số mục thành tổng.", "",
    "Với C/P/U và N=C+P+U: đầy đủ=C/N×100; quy đổi=(C+0,5P)/N×100; có ít nhất một phần=(C+P)/N×100. Covered cần tất cả facets trong neutral và cả bốn persona; partial có một phần hoặc thiếu ở một lớp; uncovered không có chứng cứ. Theo mục chỉ xét facets thực sự nằm trong mục đó.", "",
    "Đối chiếu lại toàn bộ 92 đơn vị: chứng cứ cũ chỉ được kế thừa khi lời đáp không đổi, hoặc neutral đã được audit được giữ nguyên đầy đủ trong lời đáp mới. Các chỗ mới/sửa có chú giải facet riêng và kiểm tra anchors trong từng lớp đáp án. JSON lưu evidence theo question ID/version/answer path, toàn văn năm đáp án và nguồn để người duyệt kiểm tra. Anchors là bảo vệ chống mất nội dung, không phải máy xác minh lịch sử; đánh giá nghĩa vẫn là đề xuất biên tập thủ công.", "",
    "Có thể hợp chứng cứ từ nhiều câu khi đo nội dung tồn tại trong kho. Runtime vẫn chỉ trả một lời đáp đã duyệt, không ghép câu. Coverage 100% nếu đạt chỉ có nghĩa không còn gap theo rubric hiện tại, không có nghĩa mọi cách hỏi hay mọi kiến thức lịch sử đều được hỗ trợ.", "",
    "## Trước và sau theo lớp đáp án", "",
    table(["Lớp", "C trước", "P trước", "U trước", "% trước", "C sau", "P sau", "U sau", "% sau"], [
      ["Neutral", 69, 7, 16, 75, s.neutral.covered, s.neutral.partially_covered, s.neutral.uncovered, s.neutral.strictPercent],
      ...personaIds.map(c => [c, 61, 13, 18, 66.30, s.characters[c].covered, s.characters[c].partially_covered, s.characters[c].uncovered, s.characters[c].strictPercent]),
      ["Neutral + cả bốn persona", 61, 15, 16, 66.30, s.covered, s.partially_covered, s.uncovered, s.strictPercent],
    ]), "",
    "## Theo từng mục I–X", "",
    table(["Mục", "N", "C/P/U trước", "% trước", "C/P/U sau", "% sau", "Neutral sau", "TC / LD / PVD / VNG sau"], audit.sections.map(section => [section.sectionId, section.total, `${section.before.covered}/${section.before.partially_covered}/${section.before.uncovered}`, section.before.strictPercent, `${section.covered}/${section.partially_covered}/${section.uncovered}`, section.strictPercent, section.neutral.strictPercent, personaIds.map(c => section.characters[c].strictPercent + "%").join(" / ")])), "",
    "## Khoảng trống và giới hạn nguồn", "",
    audit.remainingGaps.length ? JSON.stringify(audit.remainingGaps, null, 2) : "Không còn đơn vị thiếu theo 92 đơn vị đã định nghĩa, trong phạm vi câu trả lời có giới hạn của nguồn. K062/K063 vẫn mang cờ cần duyệt đặc biệt; sự có mặt nội dung không tự giải quyết cảnh báo nguồn.", "",
    "N17/q057 chỉ mô tả hoạt động chung và giới hạn trước/sau; không xác định ngày, chức trách riêng từng hoạt động của Lê Duẩn. N18/q058 nói về các tổ chức Đảng/quần chúng tại chỗ, giữ đính chính Côn Đảo và trở về sau thắng lợi. Nguồn không đủ để trả ngày về đất liền chính xác, tên các tỉnh 14–18/8, năm bắt đầu hoạt động Phạm Văn Đồng hoặc mô tả chi tiết điều kiện Nam Bộ. Không thêm các dữ kiện đó để làm đẹp coverage.", "",
    "## Coverage cách diễn đạt — đo riêng", "",
    "Bộ 36 câu thử H01–H36 được lưu trước khi viết aliases, gồm sáu nhóm: hỏi ngắn, đảo trật tự, không dấu, phủ định, nhiều ý và ngoài phạm vi. Không đưa những câu này vào aliases, không chỉnh aliases sau khi xem kết quả. Đây là bộ chẩn đoán do người biên tập soạn, chưa độc lập về tác giả hoặc đại diện thống kê cho người dùng thật.", "",
    table(["Tập", "N", "Exact", "Suggest", "None", "Đúng top-3 / ý hỏi có đáp án", "Auto-answer không an toàn"], [
      ["Holdout trên v3", hold.before.total, hold.before.exact, hold.before.suggest, hold.before.none, `${hold.before.supportedTop3Hits}/${hold.before.supportedIntentCount}`, hold.before.unsafeAutoAnswers],
      ["Holdout trên v4", hold.after.total, hold.after.exact, hold.after.suggest, hold.after.none, `${hold.after.supportedTop3Hits}/${hold.after.supportedIntentCount}`, hold.after.unsafeAutoAnswers],
      ["20 probe audit cũ trên v4 (development)", audit.expressionAudit.development.after.total, audit.expressionAudit.development.after.exact, audit.expressionAudit.development.after.suggest, audit.expressionAudit.development.after.none, "Không phải holdout", audit.expressionAudit.development.after.unsafeAutoAnswers],
    ]), "",
    `Holdout không trùng canonical/alias sau chuẩn hóa: ${hold.after.declaredOverlap}. Tỷ lệ tìm đúng ứng viên top-3 trên 27 ý hỏi có đáp án kết hợp: ${hold.after.supportedTop3Percent}%. Các câu đa ý không có đáp án kết hợp và ngoài nguồn được tách khỏi mẫu số này; không coi một gợi ý liên quan là trả lời đủ nhiều ý. Không có phân bố người chơi thực, nên production expression coverage=null.`, "",
    "So sánh 2/27 → 7/27 dùng cùng bộ ý hỏi đích, trong đó một số câu đích chưa tồn tại ở v3. Vì vậy đây là kết quả của cả bổ sung nội dung lẫn aliases, không phải hiệu quả riêng của matcher. Tách nhóm có ID ứng viên đã tồn tại ở v3 bên dưới; nhóm này cũng không khẳng định đáp án v3 đã đủ mọi chi tiết.", "",
    table(["Nhóm ý hỏi", "N", "Đúng top-3 trước", "Đúng top-3 sau"], Object.entries(hold.candidateAvailability).map(([key, row]) => [key === "existingCandidates" ? "Có ID ứng viên trong v3" : "Chỉ có ID ứng viên mới ở v4", row.total, row.beforeHits, row.afterHits])), "",
    `Các probe ngoài nguồn/nhiều ý vẫn có gợi ý cần thận trọng: ${hold.after.unsupportedOrMixedSuggestions.join(", ") || "không có"}. Backend vẫn chỉ gợi ý và yêu cầu chọn câu có sẵn; không tự trả lời câu ban đầu. Chưa có bộ phân tích nghĩa để chặn mọi gợi ý không đầy đủ; không thay API/threshold trong Phase 2.5.`, "",
    table(["ID", "Loại", "Câu thử", "v3", "v4", "Đúng ứng viên v4"], hold.after.results.map((r, i) => [r.id, r.category, r.query.replaceAll("|", "/"), hold.before.results[i].matcherResult, `${r.matcherResult}: ${r.returnedQuestionIds.join(", ") || "—"}`, r.expectedQuestionIds.length ? String(r.expectedCandidateFound) : "Không có đáp án đủ nguồn"])), "",
    "## Ma trận 92 đơn vị", "",
    table(["ID", "Đơn vị", "Trước", "Neutral", "TC", "LD", "PVD", "VNG", "Tổng"], audit.units.map(u => [u.id, u.title, u.previousCoverage, u.neutralCoverage, ...personaIds.map(c => u.characterCoverage[c]), u.coverage])), "",
    "## Cảnh báo và dữ liệu có thể kiểm tra", "",
    "Giữ nguyên 18 cảnh báo cũ ở trạng thái needs_admin_review; validator v4 có 23 cảnh báo, tăng 5 (q013 CAUSES; q054/q057 LE_DUAN; q058 LE_DUAN và DATES_REVIEW). Không tự đóng, approve hoặc publish. Báo cáo review v4 chứa đủ nguồn và năm đáp án từng câu, cùng đối chiếu N17/N18 và ngày tháng/Quân lệnh/nguyên nhân.", "",
    "Audit cũ và revision 3 không bị ghi đè. JSON v4 chứa fingerprint input, before/after, từng persona, 92 units/136 facets, evidence, matching results và cảnh báo. Artifact này có doNotImportAsKnowledge=true. Không kết nối DB hoặc dùng API chatbot trong audit.", "",
  ].join("\n");
}
