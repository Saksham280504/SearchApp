// Example: category-based filter
const filterByCategory = (data, keyword) => {
  const filteredData = data.filter(row => {
    return row.Category && row.Category.toLowerCase().includes(keyword.toLowerCase());
  });
  if(filteredData.length === 0) return null;

  let CategorySearchResults = {
    CompoundNames: filteredData.map(row => row["Name"]),
    CompoundFormulas: filteredData.map(row => row["Formula"]),
    Count: filteredData.length
  };

  return CategorySearchResults;
};

// Example: compound name search
const filterByCompoundName = (data, keyword) => {
  const filteredData = data.filter(row => {
    return row.Name && row.Name.toLowerCase().includes(keyword.toLowerCase());
  });
  return filteredData;
};

module.exports = {
  filterByCategory,
  filterByCompoundName,
};
