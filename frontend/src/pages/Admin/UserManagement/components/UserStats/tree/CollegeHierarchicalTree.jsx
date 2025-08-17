import HierarchicalTree from './HierarchicalTree';

export default function CollegeHierarchyTree({ data, title, type }) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
      <HierarchicalTree data={data} title={title} type={type} />
    </div>
  );
}