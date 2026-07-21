import morfeusz2

morf = morfeusz2.Morfeusz()

# 这是你之前测试过的 50 个名词列表，我们先用它测试
test_words = ["kot", "dom", "woda", "pies", "zamek", "kobieta", "mężczyzna", "książka", "drzwi", "okno"]

results = []
for word in test_words:
    analyses = morf.analyse(word)
    for analysis in analyses:
        # 提取 lemma 和 tag
        start, end, (orth, lemma, tag, _, _) = analysis
        results.append(f"{lemma}\t{tag}")

# 打印结果
print("词干\t标签")
for r in results:
    print(r)