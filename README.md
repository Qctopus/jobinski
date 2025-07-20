# UN Jobs Market Analytics Dashboard

A comprehensive web application that analyzes UN job market data to provide actionable HR insights for UN agency departments.

## 🎯 Features

### Executive Dashboard
- **Total postings by agency** - Bar chart showing hiring volume by organization
- **Geographic distribution** - World map and charts showing job concentration by region
- **Posting volume trends** - Time series analysis of hiring patterns
- **Grade level distribution** - Breakdown of positions by UN grade levels (P1, P2, P5, etc.)
- **Application window analysis** - Average time between posting and deadline by agency

### Key Analytics
- **Agency Benchmarking** - Compare hiring patterns across UN agencies
- **Market Intelligence** - Seasonal trends and competitive landscape insights
- **Detailed Analytics** - Deep-dive into experience requirements and geographic trends
- **Smart Filtering** - Advanced filtering by agency, grade, location, and date range

### Insights Engine
- Automated insights generation based on data patterns
- Key performance indicators for HR decision-making
- Comparative analysis across agencies and regions
- Export capabilities for reports and presentations

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Modern web browser

### Installation

1. **Clone or download this project**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser to [http://localhost:3000](http://localhost:3000)**

### Data Loading

The dashboard supports two ways to load data:

1. **Upload your own CSV file** - Drag and drop any UN jobs CSV file
2. **Use sample data** - Click "Load Sample UN Jobs Data" to use the included dataset

## 📊 Data Structure

The application expects CSV files with these columns:

### Required Fields
- `id` - Unique job identifier
- `title` - Job title
- `duty_station` - Work location
- `duty_country` - Country of work
- `duty_continent` - Continental region
- `up_grade` - UN grade level (P1, P2, P5, etc.)
- `short_agency` / `long_agency` - UN agency name
- `posting_date` - When job was posted
- `apply_until` - Application deadline

### Optional Fields
- `description` - Job description
- `hs_min_exp`, `bachelor_min_exp`, `master_min_exp` - Experience requirements
- `languages` - Language requirements
- `job_labels` - Job categories/tags

## 🎨 Technical Details

### Tech Stack
- **Frontend:** React 18 with TypeScript
- **Charts:** Recharts for data visualization
- **Styling:** Tailwind CSS with custom UN branding
- **Data Processing:** Papa Parse for CSV handling
- **Icons:** Lucide React icons

### Key Components

1. **FileUploader** - Drag-and-drop CSV upload with validation
2. **DashboardOverview** - Main metrics and visualizations
3. **FilterPanel** - Advanced filtering and search
4. **Data Processor** - CSV parsing and analytics calculations

### Data Processing Pipeline

1. **CSV Parsing** - Validates and parses uploaded data
2. **Data Enrichment** - Calculates derived metrics:
   - Application window duration
   - Posting age and seasonal patterns
   - Experience requirement analysis
   - Geographic categorization
3. **Analytics Engine** - Generates insights and metrics
4. **Real-time Filtering** - Interactive data exploration

## 📈 Analytics Features

### Executive Metrics
- Total job postings across all agencies
- Active agencies and geographic reach
- Average application window periods
- Trending insights and recommendations

### Agency Comparison
- Posting frequency by organization
- Application window benchmarking
- Geographic presence analysis
- Experience requirement trends

### Market Intelligence
- Seasonal hiring patterns
- Most competitive locations
- Language requirement analysis
- Remote vs. on-site trends

### Advanced Analytics
- Correlation analysis between variables
- Statistical insights and forecasting
- Custom filtering and data exports
- Detailed breakdowns by multiple dimensions

## 🔧 Customization

### Styling
The application uses Tailwind CSS with custom UN color scheme:
- Primary blue: `#009edb`
- Dark blue: `#0077be`
- Light blue: `#4db8e8`

### Data Fields
To add new data fields:
1. Update the `JobData` interface in `src/types/index.ts`
2. Modify the data processing logic in `src/utils/dataProcessor.ts`
3. Add new filters or visualizations as needed

### Charts and Visualizations
- All charts use Recharts library
- Easy to add new chart types
- Responsive design for all screen sizes
- Export capabilities built-in

## 📋 Usage Tips

### Filtering Data
- Use the **Filters** button to show/hide the filter panel
- Combine multiple filters for detailed analysis
- Use the search bar for quick text-based filtering
- Clear all filters with one click

### Exporting Results
- Click **Export Data** to download filtered results as CSV
- Charts can be exported via browser print functionality
- Copy insights and metrics for reports

### Performance
- Large datasets (10k+ jobs) are handled efficiently
- Real-time filtering and analytics
- Optimized data processing pipeline
- Progressive loading for better UX

## 🚧 Roadmap

### Phase 2 Features (Coming Soon)
- **Agency Benchmarking Module** - Detailed competitive analysis
- **Market Intelligence Dashboard** - Predictive analytics and trends
- **Advanced Analytics Suite** - Statistical modeling and correlations
- **PDF Report Generation** - Automated executive summaries
- **API Integration** - Real-time data updates
- **Multi-language Support** - Interface localization

### Planned Enhancements
- Interactive world map for geographic data
- Machine learning-powered insights
- Email alert system for new postings
- Advanced data visualization options
- Mobile-responsive design improvements

## 🤝 Contributing

This dashboard is designed to be extensible. Key areas for enhancement:

1. **New Chart Types** - Add specialized visualizations
2. **Additional Filters** - More granular data exploration
3. **Export Formats** - PDF, Excel, PowerPoint integration
4. **Performance Optimization** - Handle larger datasets
5. **UI/UX Improvements** - Enhanced user experience

## 📝 License

This project is created for UN agency HR analytics and evaluation purposes.

## 🆘 Support

For technical support or feature requests:
1. Check the browser console for any error messages
2. Ensure your CSV file matches the expected format
3. Verify that all required dependencies are installed
4. Try refreshing the page and re-uploading data

---

**Built with ❤️ for UN agency HR departments to make data-driven hiring decisions.** 