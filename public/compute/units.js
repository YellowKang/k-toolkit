/* Shared unit definitions, including unambiguous SI / IEC storage units. */
(function () {
const categories = {
  length: { base: 'm', units: [
    ['m', 1, '米', 'Meter'], ['km', 1000, '千米', 'Kilometer'], ['cm', 0.01, '厘米', 'Centimeter'], ['mm', 0.001, '毫米', 'Millimeter'],
    ['um', 1e-6, '微米', 'Micrometer'], ['in', 0.0254, '英寸', 'Inch'], ['ft', 0.3048, '英尺', 'Foot'], ['yd', 0.9144, '码', 'Yard'],
    ['mi', 1609.344, '英里', 'Mile'], ['nmi', 1852, '海里', 'Nautical mile'], ['li', 500, '里（市制）', 'Li (Chinese mile)'],
    ['chi', 1 / 3, '尺（市制）', 'Chi (Chinese foot)'], ['cun', 1 / 30, '寸（市制）', 'Cun (Chinese inch)'] ] },
  mass: { units: [
    ['kg', 1, '千克', 'Kilogram'], ['g', 0.001, '克', 'Gram'], ['mg', 1e-6, '毫克', 'Milligram'], ['t', 1000, '吨', 'Tonne'],
    ['lb', 0.45359237, '磅', 'Pound'], ['oz', 0.028349523125, '盎司', 'Ounce'], ['jin', 0.5, '斤', 'Jin (斤)'], ['liang', 0.05, '两', 'Liang (两)'] ] },
  temperature: { units: [['c', null, '摄氏度 °C', 'Celsius °C'], ['f', null, '华氏度 °F', 'Fahrenheit °F'], ['k', null, '开尔文 K', 'Kelvin K']] },
  area: { units: [
    ['m2', 1, '平方米', 'Square meter'], ['km2', 1e6, '平方千米', 'Square kilometer'], ['cm2', 1e-4, '平方厘米', 'Square centimeter'],
    ['ha', 1e4, '公顷', 'Hectare'], ['mu', 2000 / 3, '亩', 'Mu (亩)'], ['ft2', 0.09290304, '平方英尺', 'Square foot'],
    ['in2', 0.00064516, '平方英寸', 'Square inch'], ['acre', 4046.8564224, '英亩', 'Acre'] ] },
  volume: { units: [
    ['l', 1, '升', 'Liter'], ['ml', 0.001, '毫升', 'Milliliter'], ['m3', 1000, '立方米', 'Cubic meter'],
    ['usgal', 3.785411784, '美制加仑', 'US gallon'], ['ukgal', 4.54609, '英制加仑', 'UK gallon'],
    ['usfloz', 0.0295735295625, '美制液量盎司', 'US fluid ounce'], ['uscup', 0.2365882365, '美制杯', 'US cup'] ] },
  time: { units: [
    ['ms', 0.001, '毫秒', 'Millisecond'], ['s', 1, '秒', 'Second'], ['min', 60, '分钟', 'Minute'], ['h', 3600, '小时', 'Hour'],
    ['d', 86400, '天', 'Day'], ['wk', 604800, '周', 'Week'], ['yr', 31536000, '年（365 天）', 'Year (365 days)'] ] },
  storage: { units: [['B',1,'字节 B','Byte'], ['kB',1e3,'千字节 kB','Kilobyte'], ['MB',1e6,'MB','MB'], ['GB',1e9,'GB','GB'], ['TB',1e12,'TB','TB'], ['PB',1e15,'PB','PB'],
    ['KiB',1024,'KiB','KiB'], ['MiB',1024 ** 2,'MiB','MiB'], ['GiB',1024 ** 3,'GiB','GiB'], ['TiB',1024 ** 4,'TiB','TiB'], ['PiB',1024 ** 5,'PiB','PiB'], ['bit',0.125,'比特 bit','Bit']] },
  speed: { units: [
    ['mps', 1, '米/秒', 'Meters/second'], ['kmh', 1 / 3.6, '千米/小时', 'Kilometers/hour'], ['mph', 0.44704, '英里/小时', 'Miles/hour'],
    ['kn', 1852 / 3600, '节', 'Knot'], ['fps', 0.3048, '英尺/秒', 'Feet/second'] ] },
  numfmt: { units: null },
};
  const clean = value => Number(value.toPrecision(12));
  const categoryAliases = {weight:'mass',temp:'temperature'};
  const aliases = {length:{inch:'in',mile:'mi',yard:'yd'},temperature:{C:'c',F:'f',K:'k'},speed:{'m/s':'mps','km/h':'kmh',knot:'kn'},storage:{KB:'kB'}};
  function convert(category, value, from, to) {
    category = categoryAliases[category] || category;
    const units = categories[category]?.units;
    const fail = (zh,en) => { throw new Error(window.getCurrentLang?.() === 'en' ? en : zh); };
    if (!units) fail('未知单位类别：'+category,'Unknown category: '+category);
    if (typeof value !== 'number' || !Number.isFinite(value)) fail('请输入有限数值','Enter a finite number');
    from = aliases[category]?.[from] || from; to = aliases[category]?.[to] || to;
    const f = units.find(u=>u[0]===from), t = units.find(u=>u[0]===to);
    if (!f || !t) fail('未知单位：'+(!f?from:to),'Unknown unit: '+(!f?from:to));
    let result;
    if (category === 'temperature') {
      const c = from === 'c' ? value : from === 'f' ? (value - 32) * 5/9 : value - 273.15;
      if (c < -273.1500000001) fail('温度不能低于绝对零度','Temperature cannot be below absolute zero');
      result = to === 'c' ? c : to === 'f' ? c * 9/5 + 32 : c + 273.15;
    } else result = value * f[1] / t[1];
    if (!Number.isFinite(result)) fail('结果超出数值范围','Result is outside the numeric range');
    return clean(result);
  }
  const storageUnits = ['B','KiB','MiB','GiB','TiB','PiB','kB','MB','GB','TB','PB','bit'].map(id=>categories.storage.units.find(u=>u[0]===id).slice(0,2));
  (window.KCompute ||= {}).units = Object.freeze({ categories, convert, clean, storageUnits, category: id => categoryAliases[id] || id, unit: (category,id) => aliases[categoryAliases[category] || category]?.[id] || id });
})();
