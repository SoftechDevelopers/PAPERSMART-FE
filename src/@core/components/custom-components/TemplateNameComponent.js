// src/components/TemplateNameComponent.jsx
import themeConfig from 'src/configs/themeConfig'

const TemplateNameComponent = ({ mode }) => {
  // ** States
  const partOne = themeConfig.templateName.substring(0, 5)
  const partTwo = themeConfig.templateName.substring(5)

  return (
    <div>
      {mode === 'light' ? (
        <>
          <span style={{ color: '#4a218a' }}>{partOne}</span>
          <span style={{ color: '#E4A324' }}>{partTwo}</span>
        </>
      ) : (
        <>
          <span style={{ color: '#E0E0E0' }}>{partOne}</span>
          <span style={{ color: '#E4A324' }}>{partTwo}</span>
        </>
      )}
    </div>
  )
}

export default TemplateNameComponent
