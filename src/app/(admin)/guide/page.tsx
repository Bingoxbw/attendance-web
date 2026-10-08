import { AppShell } from "@/components/AppShell";

export default function GuidePage() {
  return (
    <AppShell>
      <section className="panel p-6">
        <h2 className="text-xl font-semibold">导入模板说明</h2>
        <p className="muted mt-2 text-sm">
          请尽量保持与样例一致的列名，系统按列名识别，不依赖列顺序。
        </p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h3 className="font-semibold">1. 支部名单（成员档案）</h3>
          <p className="muted mt-2 text-sm">样例：第九党支部信息2026.xlsx</p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
            <li>必含列：姓名</li>
            <li>强烈建议：学号、一卡通号</li>
            <li>可选：性别、手机号码、党员身份、导师姓名、备注</li>
            <li>
              「下方为积极分子」等分区标题行会被自动跳过；其后人员标为积极分子
            </li>
            <li>备注为「发展」也会标为积极分子（默认不计入到达率）</li>
          </ul>
        </section>

        <section className="panel p-6">
          <h3 className="font-semibold">2. 签到/签退表</h3>
          <p className="muted mt-2 text-sm">
            样例：信息学院第二次集中大课签退(1).xlsx
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
            <li>工作表「签到活动信息」：签到主题、起止日期、地址等</li>
            <li>
              工作表「扫码签到数据」列：序号、签到日期、姓名、党支部名称、是否为新生党员、学号
            </li>
            <li>
              匹配优先级：学号精确 → 一卡通号精确（签到「学号」列可能填一卡通）→
              姓名唯一匹配
            </li>
            <li>
              支部到达率只统计「已导入档案」中的成员，不以签到表支部名为准
            </li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
